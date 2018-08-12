#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: prolific <pipeline> <program>

        -i, --inherit   <number>        file handles to inherit
        -c, --configuration <path>      path to configuration
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
var path = require('path')
var url = require('url')
var children = require('child_process')

// Control-flow utilities.
var cadence = require('cadence')
var delta = require('delta')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Route messages through a process hierarchy using Node.js IPC.
var Descendent = require('descendent')

// Exceptions that you can catch by type.
var Interrupt = require('interrupt').createInterrupter('prolific')

// Command line and environment interpretation utilities.
var inherit = require('prolific.inherit')

// Construct a prolific pipeline from a configuration.
var Pipeline = require('prolific.pipeline')

// Monitoring of streams that contain logging messages.
var Synchronous = require('prolific.consolidator/synchronous')
var Asynchronous = require('prolific.consolidator/asynchronous')

// TODO Now we require that anyone standing between a root Prolific monitor and
// a leaf child process use the Descendent library.
var parallel = cadence(function (async, program, inheritance, configuration, argv) {
    var destructible = new Destructible('prolific')
    program.on('shutdown', destructible.destroy.bind(destructible))

    var descendent = new Descendent(program)
    destructible.destruct.wait(descendent, 'decrement')

    var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
    // TODO Maybe have something to call to notify of failure to finish.
    destructible.destruct.wait(child, 'kill')

    descendent.addChild(child, null)

    var synchronous = new Synchronous(child.stderr, program.stderr)

    async(function () {
        destructible.completed.wait(async())
    }, function (exitCode) {
        return [ exitCode ]
    })

    async([function () {
        destructible.destroy()
    }], function () {
        cadence(function (async) {
            async(function () {
                delta(async()).ee(child).on('close')
            }, function (exitCode, signal) {
                console.log(exitCode, signal)
                // Will only ever equal zero. We do not have the `null, "SIGTERM"`
                // combo because we always register a `SIGTERM` handler. The
                // `"SIGTERM"` response is only when the default hander fires.
                // The `"SIGTERM"` is determined by whether or not the child has
                // a `"SIGTERM"` handler, not by any action by the parent. (i.e.
                // whether or not the parent calles `child.kill()`. The behavior
                // is still the same if we send a kill signal from the shell.
                Interrupt.assert(exitCode == 0, 'child.exit', {
                    exitCode: exitCode,
                    signal: signal,
                    argv: argv
                })
            })
        })(destructible.monitor('child'))

        synchronous.listen(child.stderr, program.stderr, destructible.monitor('synchronous'))
    }, function () {
        program.ready.unlatch()
        destructible.completed.wait(async())
    })

    descendent.on('prolific:pipe', function (message) {
        descendent.down(message.cookie.from, 'prolific:pipe', true, monitors[message.cookie.monitor].stdio[3])
    })

    descendent.on('prolific:accept', function (message) {
        descendent.down(message.cookie.from, 'prolific:accept', message.body)
    })

    var monitors = {}
    descendent.on('prolific:monitor', function (message) {
        var monitor = children.spawn('node', [
            path.join(__dirname, 'monitor.bin.js'),
            '--configuration', configuration,
            '--supervisor', process.pid
        ], {
            stdio: [ 'pipe', 1, 2, 'pipe', 'ipc' ]
        })

        monitors[monitor.pid] = monitor

        synchronous.addConsumer(message.body, {
            consume: function (chunk) {
                monitor.stdin.write(JSON.stringify(chunk) + '\n')
                if (chunk.eos) {
                    monitor.stdin.end()
                    descendent.decrement()
                }
            }
        })

        descendent.addChild(monitor, { monitor: monitor.pid, from: message.from, pid: message.body })
        descendent.increment()

        cadence(function (async) {
            async(function () {
                delta(async()).ee(monitor).on('exit')
            }, function (exitCode, signal) {
                Interrupt.assert(exitCode == 0, 'monitor.exit', {
                    exitCode: exitCode,
                    signal: signal,
                    argv: argv
                })
                return []
            })
        })(destructible.monitor([ 'monitor', Object.keys(monitors).length ]))
    })
})

require('arguable')(module, require('cadence')(function (async, program) {
    program.ultimate.ipc = true

    program.helpIf(program.ultimate.help)

    var configuration = program.ultimate.configuration

    async(function () {
        var inheritance = inherit(program)
        process.env.PROLIFIC_SUPERVISOR_PROCESS_ID = process.pid
        parallel(program, inheritance, configuration, program.argv, async())
    })
}))
