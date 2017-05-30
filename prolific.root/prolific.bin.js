#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: node prolific.tcp.bin.js

        -i, --inherit   <number>        file handles to inherit
        -c, --cluster                   run in cluster mode
        -I, --ipc                       enable Node.js IPC forwarding
            --configuration <string>    base configuration JSON or environment variable
            --help                      display this message

    ___ $ ___ en_US ___

        log is required:
            the `--log` address and port is a required argument

        port is not an integer:
            the `--log` port must be an integer

    ___ . ___
*/

var monitor = require('prolific.monitor')
var children = require('child_process')
var cadence = require('cadence')
var inherit = require('prolific.inherit')
var ipc = require('prolific.ipc')
var path = require('path')
var url = require('url')
var abend = require('abend')
var delta = require('delta')
var exit = require('./exit')
var Pipeline = require('prolific.pipeline')
var Destructible = require('destructible')
var Synchronous = require('prolific.consolidator/synchronous')
var Asynchronous = require('prolific.consolidator/asynchronous')

// Lots of struggle as I reconsider how to manage errors, return values and the
// this pointer.

var direct = cadence(function (async, program, inheritance, configuration, argv) {
    var destructible = new Destructible('direct')
    program.on('shutdown', destructible.destroy.bind(destructible))
    var killer = require('./killer')
    var pipeline = new Pipeline(configuration)
    async([function () {
        pipeline.close(async())
    }], function () {
        pipeline.open(async())
    }, function () {
        var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
        ipc(program.ultimate.ipc, process, child)
        destructible.addDestructor('kill', child, 'kill')
        var synchronous = new Synchronous
        var asynchronous = new Asynchronous(pipeline.processors[0])
        synchronous.addConsumer('0', asynchronous)
// This is a strange useage where the method is going to return an error, it
// will be the error used to report.
        destructible.monitor(async, 'child')(function (ready) {
            async(function () {
                delta(async()).ee(child).on('exit')
                ready.unlatch()
            }, function (exitCode, signal) {
                return exit(exitCode, signal)
            })
        })
        destructible.monitor(async, 'synchronous')(function (ready) {
// TODO Staccato instead of data.
            synchronous.listen(child.stderr, program.stderr, async())
            ready.unlatch()
        })
        destructible.monitor(async, 'asynchronous')(function (ready) {
// TODO Staccato instead of data.
//
// It does not seem likely that you'll get an error out of the child pipes and
// if you do, it is uncommon enough that there is not much more to do for now
// besides crash. Can't do anything if the synchronous pipe crashes, so maybe
// only worry about the asynchronous pipe. Ah, so, we could just shutdown when
// we see the asynchronous pipe error, or maybe even finish for any reason.
            async([function () {
                child.kill()
            }], function () {
                asynchronous.listen(child.stdio[inheritance.fd], async())
                ready.unlatch()
            })
        })
// TODO Considered giving `Destructible.completed` an array of gathered
// responses. That way you could use it as the response from the function.
// Instead I'm calling it here first, except that isn't how Cadence works.
// Cadence returns the first error caught. Thus, the callback we create above
// could catch an error, that error would be returned from this function,
// swallowing a nicer hung interrupt exception.
//
// Two directions to go. First, make Cadence return errors in the order
// specified by their callback creation. Then this can move to the top it is
// always the first error returns. Second, make destructible gather responeses
// from monitor and return them in completed. But, the moment I try to work that
// out in Destructible, it gets confusing. Where to keep them. How to signal you
// want them gathered. Always gather? What about rescue. Don't gather, right?
//
// If you do use some sort of gathered completed, then you can't really make too
// much use of the returns. Also, you'll note that all of the above will
// rethrow their errors, so this timeout is not actually going to cause a hang
// to timeout.
//
// Hello, again. Considering how it worked before. There was this orthoginal
// timer that would raise an uncatchable exception and crash the program because
// the inability to quit is more of a programmer error than a run time error.
// Here I'm trying to funnel that exception to the completed latch. When using
// the Cadence-friendly Destructible invocation this will mean that we're adding
// a wait for many sub-Cadences.
        destructible.timeout(5000)
    })
})

var clustered = cadence(function (async, program, inheritance, configuration, argv) {
    var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
    var synchronous = new Synchronous(child.stderr, program.stderr)
    var monitors = []
    child.on('message', function (message) {
        if (message.module != 'prolific' || message.method != 'monitor') {
            return
        }
        var monitor = children.spawn('node', [ path.join(__dirname, 'monitor.bin.js') ], {
            stdio: [ 'inherit', 'inherit', 'inherit', 'pipe', 'ipc' ]
        })
        child.send('message', {
            module: 'prolific',
            method: 'socket',
            pid: message.pid
        }, monitor.stdio[3])
        synchronous.addConsumer(message.pid, function (chunk) {
            monitor.send({
                module: 'prolific',
                method: 'chunk',
                body: chunk
            })
        })
    })
    destructible.monitor(async, 'synchronous')(function (ready) {
        synchronous.listen(async())
        ready.unlatch()
    })
    destructible.completed(10000, async())
})

require('arguable')(module, require('cadence')(function (async, program) {
    var configure = require('./configure')

    if (program.ultimate.cluster) {
        program.ultimate.ipc = true
    }

    program.helpIf(program.ultimate.help)

    var configuration = configure(program.env, program.ultimate.configuration)

    // TODO `inherit` skips write fd if cluster
    var inheritance = inherit(program)
    configuration.fd = program.ultimate.cluster ? 'IPC' : inheritance.fd
    async(function () {
        Pipeline.parse(program, configuration, async())
    }, function (configuration, argv) {
        process.env.PROLIFIC_CONFIGURATION = JSON.stringify(configuration)
        if (program.ultimate.cluster) {
            clustered(program, inheritance, configuration, argv, async())
        } else {
            direct(program, inheritance, configuration, argv, async())
        }
    })
}))
