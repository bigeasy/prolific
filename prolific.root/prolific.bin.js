#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: prolific <pipeline> <program>

        -i, --inherit   <number>        file handles to inherit
        -s, --siblings                  run monitors as siblings
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

// Node.js API.
var assert = require('assert')
var children = require('child_process')
var path = require('path')
var url = require('url')

var Signal = require('signal')

var cadence = require('cadence')
var inherit = require('prolific.inherit')
var ipc = require('prolific.ipc')
var delta = require('delta')
var exit = require('./exit')

var Thereafter = require('thereafter')

// Construct a prolific pipeline from a configuration.
var Pipeline = require('prolific.pipeline')

var Destructible = require('destructible')
var Synchronous = require('prolific.consolidator/synchronous')
var Asynchronous = require('prolific.consolidator/asynchronous')

// Lots of struggle as I reconsider how to manage errors, return values and the
// this pointer.

var direct = cadence(function (async, program, inheritance, configuration, argv) {
    var destructible = new Destructible('direct')
    program.on('shutdown', destructible.destroy.bind(destructible))

    var thereafter = new Thereafter
    destructible.addDestructor('thereafter', thereafter, 'cancel')

    var pipeline = new Pipeline(configuration)
    var synchronous = new Synchronous
    var asynchronous = new Asynchronous(pipeline.processors[0])

    async([function () {
        pipeline.close(async())
    }], function () {
        pipeline.open(async())
    }, function () {
        var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
        ipc(program.ultimate.ipc, process, child)
        destructible.addDestructor('kill', child, 'kill')
        synchronous.addConsumer('0', asynchronous)
// This is a strange useage where the method is going to return an error, it
// will be the error used to report.
        thereafter.run(function (ready) {
            cadence(function (async) {
                async(function () {
                    delta(async()).ee(child).on('exit')
                    ready.unlatch()
                }, function (exitCode, signal) {
                    return exit(exitCode, signal)
                })
            })(destructible.monitor('child'))
        })
        thereafter.run(function (ready) {
            cadence(function (async) {
                synchronous.listen(child.stderr, program.stderr, async())
                ready.unlatch()
            })(destructible.monitor('synchronous'))
        })
        thereafter.run(function (ready) {
// It does not seem likely that you'll get an error out of the child pipes and
// if you do, it is uncommon enough that there is not much more to do for now
// besides crash. Can't do anything if the synchronous pipe crashes, so maybe
// only worry about the asynchronous pipe. Ah, so, we could just shutdown when
// we see the asynchronous pipe error, or maybe even finish for any reason.
            cadence(function (async) {
                async([function () {
                    child.kill()
                }], function () {
                    asynchronous.listen(child.stdio[inheritance.fd], async())
                    ready.unlatch()
                })
            })(destructible.monitor('asynchronous'))
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
        destructible.completed(5000, async())
    }, function () {
        asynchronous.exit()
    })
})

var siblings = cadence(function (async, program, inheritance, configuration, argv) {
    var destructible = new Destructible('siblings')
    program.on('shutdown', destructible.destroy.bind(destructible))

    var thereafter = new Thereafter
    var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
    destructible.addDestructor('kill', child, 'kill')

    var synchronous = new Synchronous(child.stderr, program.stderr)
    destructible.addDestructor('thereafter', thereafter, 'cancel')
    destructible.addDestructor('DEBUG TODO', function () {
        console.log('DESTROYED!!!')
    })

    var exited = new Signal

    var monitors = 0
    thereafter.run(function (ready) {
        cadence(function (async) {
            async(function () {
                delta(async()).ee(child).on('exit')
                ready.unlatch()
            }, function (exitCode, signal) {
                console.log('CHILD EXITED', exitCode, signal)
                async(function () {
                    exited.wait(5000, async())
                }, function () {
                    return exit(exitCode, signal)
                })
            })
        })(destructible.monitor('child'))
    })
    child.on('message', function (message) {
        if (message.module != 'prolific' || message.method != 'monitor') {
            return
        }
        var pid = message.pid
        var monitor = children.spawn('node', [
            path.join(__dirname, 'monitor.bin.js')
        ], {
            stdio: [ 0, 1, 2, 'pipe', 'ipc' ]
        })
        monitor.once('message', function (message) {
            console.log('ONCE message', message)
            // TODO Maybe there's a race here.
            child.send({
                module: 'prolific',
                method: 'socket',
                pid: pid
            }, monitor.stdio[3])
            synchronous.addConsumer(pid, {
                consume: function (chunk) {
                    exited.unlatch()
                    monitor.send({
                        module: 'prolific',
                        method: 'chunk',
                        body: chunk
                    })
                }
            })
        })
        destructible.addDestructor([ 'kill', monitors ], function () {
            assert(exited.open != null)
        })
        destructible.addDestructor([ 'kill', monitors, 'x' ], function () { console.log('DID DESTRUCT') })
        thereafter.run(function (ready) {
            cadence(function (async) {
                async(function () {
                    delta(async()).ee(monitor).on('exit')
                    ready.unlatch()
                }, function (errorCode, signal) {
                    console.log('MONITOR EXIT', errorCode, signal)
                    assert(signal == 'SIGTERM' || errorCode == 0)
                    return []
                })
            })(destructible.monitor([ 'monitor', monitors ]))
        })
        monitors++
    })
    thereafter.run(function (ready) {
        cadence(function (async) {
            async(function () {
                synchronous.listen(child.stderr, program.stderr, async())
                ready.unlatch()
            }, function () {
                exited.wait(10000, async())
            })
        })(destructible.monitor('synchronous'))
    })
    destructible.completed(10000, async())
})

require('arguable')(module, require('cadence')(function (async, program) {
    var configure = require('./configure')

    if (program.ultimate.siblings) {
        program.ultimate.ipc = true
    }

    program.helpIf(program.ultimate.help)

    var configuration = configure(program.env, program.ultimate.configuration)

    // TODO `inherit` skips write fd if cluster
    var inheritance = inherit(program)
    configuration.fd = program.ultimate.siblings ? 'IPC' : inheritance.fd
    async(function () {
        Pipeline.parse(program, configuration, async())
    }, function (configuration, argv) {
        process.env.PROLIFIC_CONFIGURATION = JSON.stringify(configuration)
        if (program.ultimate.siblings) {
            siblings(program, inheritance, configuration, argv, async())
        } else {
            direct(program, inheritance, configuration, argv, async())
        }
    })
}))
