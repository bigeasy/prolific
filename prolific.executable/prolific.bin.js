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
const os = require('os')

const noop = require('nop')

const once = require('prospective/once')
const callback = require('prospective/callback')

const rimraf = require('rimraf')

const Queue = require('avenue')

const fnv = require('hash.fnv')

const Isochronous = require('isochronous')

// Exceptions that you can catch by type.
const Interrupt = require('interrupt').create('prolific')

// Command line and environment interpretation utilities.
const inherit = require('prolific.inherit')

// Monitoring of streams that contain logging messages.
const Collector = require('prolific.collector')
const Watcher = require('prolific.watcher')

const coalesce = require('extant')

const Tmp = require('./tmp')
const Killer = require('./killer')
const Header = require('./header')

const Cubbyhole = require('cubbyhole')

// Selected signals for propagation. These would appear to be the sort of
// signals that a user would send to the monitored child from the terminal.
// Either that or the sort of signals that a supervisor program would expect
// the supervised program to respond to. Either way, the Prolific supervisor
// doesn't really have a plan to handle them, so it forwards them to the
// supervised child.
//
// Other signals would appear to be the sort of signals that the operating
// system would send directly to the affected process.
//
// At some point we may add command line switches to specify with signals to
// forward, but for now we'll provide this list as a convention and adjust the
// convention to user feedback. We could give the option to cancel all
// forwarding and then the user would be responsible for sending signals
// directly to the supervised child process by its pid.
//
// https://nodejs.org/api/process.html#process_signal_events
//
const signals =  [ 'SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT', 'SIGABRT', 'SIGUSR2' ]

require('arguable')(module, { $trap: false }, async arguable => {
    arguable.helpIf(arguable.ultimate.help)

    const processor = arguable.ultimate.processor

    process.env.PROLIFIC_SUPERVISOR_PROCESS_ID = process.pid

    const sidecars = {}

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
            await exit
            countdown.decrement()
        }
    }

    const cubbyhole = new Cubbyhole

    const Printer = require('./printer')

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
            const header = await Header(socket)
            printer.say('header', { header })
            if (header != null) {
                assert.equal(header.method, 'announce', 'announce missing')
                killers.start.unwatch(header.pid)
                await cubbyhole.get(header.pid)
                cubbyhole.remove(header.pid)
                printer.say('dispatch', { header, destroyed: socket.destroyed })
                // **TODO** Uncomment to hang unit test.
                // throw new Error
                sidecars[header.pid].send({ module: 'prolific', method: 'socket' }, socket)
            }
        }
    }))
    children.destruct(() => sockets.shifter.destroy())
    children.destruct(() => printer.say('destruct.children', {}))

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

    const watcher = new Watcher(children.durable('watcher'), buffer => {
        return fnv(0, buffer, 0, buffer.length)
    }, path.join(tmp, 'publish'))
    countdown.destruct(() => watcher.drain())

    const killers = {
        start: new Killer(100, printer),
        exit: new Killer(100, printer)
    }
    Error.stackTraceLimit = 32
    killers.start.on('killed', killers.exit.watch.bind(killers.exit))
    killers.exit.on('killed', watcher.killed.bind(watcher))
    children.durable([ 'killer', 'start' ], killers.start.run())
    children.durable([ 'killer', 'exit' ], killers.exit.run())
    children.destruct(() => killers.start.destroy())
    children.destruct(() => killers.exit.destroy())

    const collector = new Collector

    // watcher.on('notice', notice => console.log(notice))

    watcher.on('data', data => collector.data(data))

    const argv = arguable.argv.slice()
    const main = argv.shift()

    collector.on('data', data => {
        const pid = data.pid
        switch (data.body.method) {
        case 'start': {
                const sidecar = processes.spawn('node', [
                    path.join(__dirname, 'sidecar.bin.js'),
                    '--processor', processor,
                    '--supervisor', process.pid,
                    '--tmp', tmp,
                    '--child', pid,
                    '--main', main
                ], {
                    stdio: [ 'ignore', 'inherit', 'inherit', 'ipc' ]
                })
                function message (message) {
                    printer.say(message.method, message)
                    switch (message.method) {
                    case 'receiving':
                        cubbyhole.set(message.child, true)
                        break
                    case 'closed':
                        killers.exit.watch(message.child)
                        break
                    }
                }
                sidecar.on('message', message)
                sidecar.on('exit', () => sidecar.removeListener('message', message))
                countdown.increment()
                sidecars[pid] = sidecar
                children.ephemeral([ 'sidecar', sidecar.pid ], supervise.sidecar(sidecar, pid))
            }
            break
        case 'say': {
                printer.push(data.body)
            }
            break
        case 'eos': {
                // TODO No need to `killer.purge()`, we can absolutely remove
                // the pid from the `Killer` here.
                destructible.ephemeral('exit', (async () => {
                    const sidecar = sidecars[pid]
                    const [ code, signal ] = await exit
                    /*
                    sidecar.send({
                        module: 'prolific',
                        method: 'synchronous',
                        body: { method: 'exit', code: code, signal: signal }
                    })
                    */
                    sidecar.send({
                        module: 'prolific',
                        method: 'synchronous',
                        body: null
                    })
                })())
            }
            break
        default: {
                killer.exit(pid)
                const sidecar = sidecars[pid]
                // **TODO** Wait on callback?
                sidecar.send({
                    module: 'prolific',
                    method: 'synchronous',
                    body: data.body
                })
            }
            break
        }
    })

    printer.say('start', {})

    const stdio = inherit(arguable)

    // TODO Restore inheritance.
    const child = processes.spawn(main, argv, { stdio: stdio })
    killers.start.watch(child.pid)

    const traps = {}
    for (const signal of signals) {
        process.on(signal, traps[signal] = child.kill.bind(child, signal))
    }

    const exit = once(child, 'exit').promise

    children.ephemeral('close', supervise.child(child))

    // TODO How do we propogate signals?
    // await arguable.destroyed
    // destructible.destroy()
    await children.destructed
    supervisor.destroy()
    await supervisor.destructed
    const [ code, signal ] = await exit
    for (const signal in traps) {
        process.removeListener(signal, traps[signal])
    }
    if (signal != null) {
        setInterval(noop, 1000)
        setImmediate(() => process.kill(process.pid, signal))
    }
    return code
})
