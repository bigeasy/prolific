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

// Controlled demolition of objects.
var Destructible = require('destructible')

// Route messages through a process hierarchy using Node.js IPC.
var Descendent = require('descendent')

// Exceptions that you can catch by type.
var Interrupt = require('interrupt').createInterrupter('prolific')

// Command line and environment interpretation utilities.
var inherit = require('prolific.inherit')

// Monitoring of streams that contain logging messages.
var Synchronous = require('prolific.consolidator/synchronous')
var Asynchronous = require('prolific.consolidator/asynchronous')

// Pass messages and sockets all around the process tree.
var descendent = require('foremost')('descendent')

var Keyify = require('keyify')

var Tree = require('./processes')

var coalesce = require('extant')

// TODO Note that; we now require that anyone standing between a root Prolific
// monitor and a leaf child process use the Descendent library.
require('arguable')(module, function (program, callback) {
    program.ultimate.ipc = true

    program.helpIf(program.ultimate.help)

    var configuration = program.ultimate.configuration

    process.env.PROLIFIC_SUPERVISOR_PROCESS_ID = program.pid

    var destructible = new Destructible(7000, 'prolific')
    program.on('shutdown', destructible.destroy.bind(destructible))

    descendent.increment()

    var tree = new Tree
    var monitors = {}
    var pipes = {} // See race condition below.
    function setConsumers (chunk) {
        descendent.increment()

        var json = JSON.parse(chunk.buffer.toString())

        var monitor = children.spawn('node', [
            path.join(__dirname, 'monitor.bin.js'),
            '--configuration', configuration,
            '--supervisor', process.pid
        ], {
            stdio: [ 'pipe', 1, 2, 'pipe', 'ipc' ]
        })

        tree.put(json.path)

        var pid = json.path[json.path.length - 1]

        monitors[pid] = monitor
        pipes[pid] = monitor.stdio[3]

        synchronous.setConsumer(json.headerId, {
            consume: function (chunk, callback) { callback() }
        })

        synchronous.setConsumer(json.streamId, {
            consume: function (chunk, callback) {
                monitor.stdin.write(JSON.stringify(chunk) + '\n', callback)
            }
        })

        descendent.addChild(monitor, { path: json.path, pid: pid })

        cadence(function (async) {
            async(function () {
                delta(async()).ee(monitor).on('exit')
            }, function (exitCode, signal) {
                Interrupt.assert(exitCode == 0, 'monitor.exit', {
                    exitCode: exitCode,
                    signal: signal,
                    argv: program.argv
                })
                return []
            })
        })(destructible.monitor([ 'monitor', monitor.pid ]))
    }

    var closing = []

    var synchronous = new Synchronous({ selectConsumer: setConsumers })

    synchronous.setConsumer('closer', {
        consume: function (chunk, callback) {
            var json = JSON.parse(chunk.buffer.toString())
            var path = [ process.pid ].concat(json.path)
            tree.processes(path).forEach(function (pid) {
                var monitor = monitors[pid]
                monitor.stdin.end()
                delete monitors[pid]
            })
            tree.prune(path)
            callback()
        }
    })

    var stdio = inherit(program)
    stdio[2] = 'pipe'
    stdio.push('ipc')
    var argv = stdio.slice(3).filter(function (handle) {
        return typeof handle == 'number'
    }).map(function (handle) {
        return '--inherit=' + handle
    }).concat(program.argv)

    argv.unshift(path.join(__dirname, 'closer.bin.js'))

    // TODO Restore inheritance.
    var child = children.spawn('node', argv, { stdio: stdio })
    // TODO Maybe have something to call to notify of failure to finish.
    destructible.destruct.wait(child, 'kill')

    descendent.addChild(child, null)

    destructible.completed.wait(callback)

    descendent.on('prolific:pipe', function (message) {
        var pid = message.cookie.path[message.cookie.path.length - 1]
        descendent.down(message.cookie.path, 'prolific:pipe', true, coalesce(pipes[pid]))
    })

    descendent.on('prolific:accept', function (message) {
        var pid = message.from[message.from.length - 1]
        descendent.down(message.cookie.path, 'prolific:accept', message.body)
    })

    var cadence = require('cadence')

    cadence(function (async) {
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
                        argv: program.argv
                    })
                    return 0
                // TODO Shut down everything as if it was Descendent notified close.
                })
            })(destructible.monitor('child'))

            cadence(function (async) {
                async([function () {
                    descendent.decrement()
                }], function () {
                    synchronous.listen(child.stderr, program.stderr, async())
                })
            })(destructible.monitor('synchronous'))
        }, function () {
            program.ready.unlatch()
        })
    })(destructible.monitor('initialize', true))
})
