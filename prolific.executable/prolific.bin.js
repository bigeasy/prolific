#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: prolific <options> <program>

    options:

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

// Route messages through a process hierarchy using Node.js IPC.
var Descendent = require('descendent')

// Exceptions that you can catch by type.
var Interrupt = require('interrupt').createInterrupter('prolific')

// Command line and environment interpretation utilities.
var inherit = require('prolific.inherit')

// Monitoring of streams that contain logging messages.
var Collector = require('prolific.collector')

// Pass messages and sockets all around the process tree.
var descendent = require('foremost')('descendent')

var collect = require('./collect')

var coalesce = require('extant')

// TODO Note that; we now require that anyone standing between a root Prolific
// monitor and a leaf child process use the Descendent library.
require('arguable')(module, require('cadence')(function (async, destructible, arguable) {
    arguable.ultimate.ipc = true

    arguable.helpIf(arguable.ultimate.help)

    var configuration = arguable.ultimate.configuration

    process.env.PROLIFIC_SUPERVISOR_PROCESS_ID = process.pid

    descendent.increment()

    var monitors = {}
    var pids = {}
    var pipes = {} // See race condition below.

    var queue = {
        push: function (envelope) {
            switch (envelope.method) {
            case 'announce':
                descendent.increment()
                var monitor = children.spawn('node', [
                    path.join(__dirname, 'monitor.bin.js'),
                    '--configuration', configuration,
                    '--supervisor', process.pid
                ], {
                    stdio: [ 'pipe', 1, 2, 'pipe', 'ipc' ]
                })
                var json = envelope.body
                var pid = json.path[json.path.length - 1]
                monitors[pid] = monitor
                pipes[pid] = monitor.stdio[3]
                pids[envelope.id] = pid
                descendent.addChild(monitor, { path: json.path, pid: pid })

                cadence(function (async) {
                    async(function () {
                        delta(async()).ee(monitor).on('exit')
                    }, function (exitCode, signal) {
                        Interrupt.assert(exitCode == 0, 'monitor.exit', {
                            exitCode: exitCode,
                            signal: signal,
                            argv: arguable.argv
                        })
                        return []
                    })
                })(destructible.durable([ 'monitor', monitor.pid ]))
                break
            case 'entries':
                var monitor = monitors[pids[envelope.id]]
                monitor.stdin.write(JSON.stringify(envelope) + '\n')
                break
            case 'exit':
                var monitor = monitors[pids[envelope.id]]
                monitor.stdin.end(JSON.stringify(envelope) + '\n')
                break
            }
        }
    }

    var stdio = inherit(arguable)
    stdio[2] = 'pipe'
    stdio.push('ipc')

    var argv = arguable.argv.slice()
    // TODO Restore inheritance.
    var child = children.spawn(argv.shift(), argv, { stdio: stdio })
    // TODO Maybe have something to call to notify of failure to finish.
    destructible.destruct.wait(child, 'kill')

    descendent.addChild(child, null)

    descendent.on('prolific:pipe', function (message) {
        var pid = message.cookie.path[message.cookie.path.length - 1]
        descendent.down(message.cookie.path, 'prolific:pipe', true, coalesce(pipes[pid]))
    })

    descendent.on('prolific:accept', function (message) {
        var pid = message.from[message.from.length - 1]
        descendent.down(message.cookie.path, 'prolific:accept', message.body)
    })

    var cadence = require('cadence')

    async(function () {
        cadence(function (async) {
            async(function () {
                delta(async()).ee(child).on('close')
            }, function (exitCode, signal) {
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
                    argv: arguable.argv
                })
                return 0
            })
        })(destructible.durable('child'))

        cadence(function (async) {
            async([function () {
                descendent.decrement()
            }], function () {
                collect(new Collector(arguable.stderr, queue), child.stderr, async())
            }, function () {
                for (var id in monitors) {
                    monitors[id].stdin.end()
                }
            })
        })(destructible.durable('synchronous'))
    })
}))
