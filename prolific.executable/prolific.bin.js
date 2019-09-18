#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: prolific <options> <program>

    options:

        -i, --inherit   <number>
            file handles to inherit

        -s, --scram     <number>
            number of seconds to wait for children to exit

        -p, --processor <path>
            path to processor

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
const processes = require('child_process')
const crypto = require('crypto')
const fs = require('fs').promises
const net = require('net')

const once = require('prospective/once')
const callback = require('prospective/callback')

const rimraf = require('rimraf')

const Queue = require('avenue')

const fnv = require('hash.fnv')

const Isochronous = require('isochronous')

// Route messages through a process hierarchy using Node.js IPC.
const Descendent = require('descendent')

// Exceptions that you can catch by type.
const Interrupt = require('interrupt').create('prolific')

// Command line and environment interpretation utilities.
const inherit = require('prolific.inherit')

// Monitoring of streams that contain logging messages.
const Collector = require('prolific.collector')
const Watcher = require('prolific.watcher')

// Pass messages and sockets all around the process tree.
const descendent = require('foremost')('descendent')

const coalesce = require('extant')

const Tmp = require('./tmp')
const Killer = require('./killer')
const Header = require('./header')

const Cubbyhole = require('cubbyhole')

// TODO Note that; we now require that anyone standing between a root Prolific
// sidecar and a leaf child process use the Descendent library. When I write
// multi-process applications I use [Olio](https://github.com/bigeasy/olio)
// where this is already implemented.
require('arguable')(module, {}, async arguable => {
    arguable.ultimate.ipc = true

    arguable.helpIf(arguable.ultimate.help)

    const processor = arguable.ultimate.processor

    process.env.PROLIFIC_SUPERVISOR_PROCESS_ID = process.pid

    const sidecars = {}
    const pids = {}
    const pipes = {} // See race condition below.

    // TODO What do you really want to name this?
    const Destructible = require('destructible')
    const destructible = new Destructible(1500, 'prolific')

    const countdown = destructible.ephemeral('countdown')
    const children = destructible.ephemeral('children')
    const supervisor = destructible.durable('supervisor')

    countdown.increment()

    const supervise = {
        sidecar: async (sidecar, pid) => {
            const [ exitCode, signal ] = await once(sidecar, 'exit').promise
            Interrupt.assert(exitCode == 0, 'sidecar.exit', {
                exitCode: exitCode,
                signal: signal,
                argv: arguable.argv
            })
            delete sidecars[pid]
            countdown.decrement()
        },
        child: async (child) => {
            const [ exitCode, signal ] = await once(child, 'exit').promise
            // Will only ever equal zero. We do not have the `null, "SIGTERM"`
            // combo because we always register a `SIGTERM` handler. The
            // `"SIGTERM"` response is only when the default hander fires. The
            // `"SIGTERM"` is determined by whether or not the child has a
            // `"SIGTERM"` handler, not by any action by the parent. (i.e.
            // whether or not the parent calles `child.kill()`. The behavior is
            // still the same if we send a kill signal from the shell.
            Interrupt.assert(exitCode == 0, 'child.exit', {
                exitCode: exitCode,
                signal: signal,
                argv: arguable.argv
            })
            countdown.decrement()
        }
    }

    const killer = new Killer(100)
    const cubbyhole = new Cubbyhole

    const Printer = require('./printer')

    descendent.increment()
    children.destruct(() => descendent.decrement())

    const tmp = await Tmp(coalesce(process.env.TMPDIR, '/tmp'), async () => {
        const [ bytes ] = await callback(callback => crypto.randomBytes(16, callback))
        return bytes.toString('hex')
    }, process.pid)
    supervisor.destruct(() => callback(callback => rimraf(tmp, callback)))

    const printer = new Printer(supervisor.durable('printer'), lines => {
        console.log(lines)
    }, JSON.stringify, 1000)

    const sockets = new Queue().shifter().paired
    children.durable('sockets', sockets.shifter.pump(async socket => {
        if (socket != null) {
            socket.unref()
            const header = await Header(socket)
            assert.equal(header.method, 'announce', 'announce missing')
            const pid = await cubbyhole.get(header.pid)
            cubbyhole.remove(header.pid)
            descendent.down([ pid ], 'prolific:socket', header, socket)
        }
    }))
    children.destruct(() => sockets.shifter.destroy())

    const server = net.createServer(socket => {
        sockets.queue.push(socket)
    })
    children.destruct(() => server.close())
    await callback(callback => server.listen(path.resolve(tmp, 'socket'), callback))

    await fs.mkdir(path.resolve(tmp, 'stage'))
    await fs.mkdir(path.resolve(tmp, 'publish'))

    process.env.PROLIFIC_TMPDIR = tmp

    const toucher = new Isochronous(60000, true, async () => {
        const now = Date.now()
        await fs.utimes(tmp, now, now)
        await fs.utimes(path.resolve(tmp, 'stage'), now, now)
        await fs.utimes(path.resolve(tmp, 'publish'), now, now)
    })

    children.durable('toucher', toucher.start())
    children.destruct(() => toucher.stop())

    killer.on('killed', pid => {
        watcher.killed(pid)
    })

    children.durable('killer', killer.run())
    children.destruct(() => killer.destroy())

    const watcher = new Watcher(children.durable('watcher'), buffer => {
        return fnv(0, buffer, 0, buffer.length)
    }, path.join(tmp, 'publish'))

    countdown.destruct(() => watcher.drain())

    const collector = new Collector

    // watcher.on('notice', notice => console.log(notice))

    watcher.on('data', data => collector.data(data))

    collector.on('data', data => {
        const pid = data.pid
        switch (data.body.method) {
        case 'start': {
                const sidecar = processes.spawn('node', [
                    path.join(__dirname, 'sidecar.bin.js'),
                    '--configuration', processor,
                    '--supervisor', process.pid
                ], {
                    stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ]
                })
                countdown.increment()
                sidecars[pid] = sidecar
                pipes[pid] = sidecar.stdio[3]
                descendent.addChild(sidecar, { pid: pid })
                children.ephemeral([ 'sidecar', sidecar.pid ], supervise.sidecar(sidecar, pid))
            }
            break
        case 'log': {
                printer.push(data.body)
            }
            break
        case 'eos': {
                killer.exited(pid)
                // TODO No need to `killer.purge()`, we can absolutely remove
                // the pid from the `Killer` here.
                const sidecar = sidecars[pid]
                descendent.down([ sidecar.pid ], 'prolific:synchronous', null)
            }
            break
        default: {
                killer.exit(pid)
                const sidecar = sidecars[pid]
                // **TODO** Wait on callback?
                descendent.down([ sidecar.pid ], 'prolific:synchronous', data.body)
            }
            break
        }
    })

    printer.log({ when: Date.now(), label: 'prolific.start' })

    const stdio = inherit(arguable)
    stdio.push('ipc')

    const argv = arguable.argv.slice()
    // TODO Restore inheritance.
    const child = processes.spawn(argv.shift(), argv, { stdio: stdio })
    // TODO Maybe have something to call to notify of failure to finish.
    // destructible.destruct(() => child.kill())

    descendent.addChild(child, null)

    descendent.on('prolific:receiving', function (message) {
        cubbyhole.set(message.cookie.pid, message.body)
    })

    children.ephemeral('close', supervise.child(child))

    // TODO How do we propogate signals?
    // await arguable.destroyed
    // destructible.destroy()
    await children.promise
    supervisor.destroy()
    await supervisor.promise
    return 0
})
