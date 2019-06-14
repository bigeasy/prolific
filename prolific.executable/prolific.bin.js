#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: prolific <options> <program>

    options:

        -i, --inherit   <number>
            file handles to inherit

        -s, --scram     <number>
            number of seconds to wait for children to exit

        -c, --configuration <path>
            path to configuration

        --help
            display this message

    ___ $ ___ en_US ___

        log is required:
            the `--log` address and port is a required argument

        port is not an integer:
            the `--log` port must be an integer

    ___ . ___
*/

// Node.js API.
const assert = require('assert')
const path = require('path')
const url = require('url')
const children = require('child_process')

// Route messages through a process hierarchy using Node.js IPC.
const Descendent = require('descendent')

// Exceptions that you can catch by type.
const Interrupt = require('interrupt').create('prolific')

// Command line and environment interpretation utilities.
const inherit = require('prolific.inherit')

// Monitoring of streams that contain logging messages.
const Collector = require('prolific.collector')

// Pass messages and sockets all around the process tree.
const descendent = require('foremost')('descendent')

const coalesce = require('extant')

const collect = require('./collect')

// TODO Note that; we now require that anyone standing between a root Prolific
// monitor and a leaf child process use the Descendent library.
require('arguable')(module, {}, async arguable => {
    arguable.ultimate.ipc = true

    arguable.helpIf(arguable.ultimate.help)

    const configuration = arguable.ultimate.configuration

    process.env.PROLIFIC_SUPERVISOR_PROCESS_ID = process.pid

    descendent.increment()

    const monitors = {}
    const pids = {}
    const pipes = {} // See race condition below.

    const queue = {
        push: function (envelope) {
            switch (envelope.method) {
            case 'announce':
                descendent.increment()
                const monitor = children.spawn('node', [
                    path.join(__dirname, 'monitor.bin.js'),
                    '--configuration', configuration,
                    '--supervisor', process.pid
                ], {
                    stdio: [ 'pipe', 1, 2, 'pipe', 'ipc' ]
                })
                const json = envelope.body
                const pid = json.path[json.path.length - 1]
                monitors[pid] = monitor
                pipes[pid] = monitor.stdio[3]
                pids[envelope.id] = pid
                descendent.addChild(monitor, { path: json.path, pid: pid })

                destructible.durable([ 'monitor', monitor.pid ], (async () => {
                    const [ exitCode, signal ] = once(monitor, 'exit')
                    Interrupt.assert(exitCode == 0, 'monitor.exit', {
                        exitCode: exitCode,
                        signal: signal,
                        argv: arguable.argv
                    })
                    return []
                })())
                break
            case 'entries':
                const monitor = monitors[pids[envelope.id]]
                monitor.stdin.write(JSON.stringify(envelope) + '\n')
                break
            case 'exit':
                const monitor = monitors[pids[envelope.id]]
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
