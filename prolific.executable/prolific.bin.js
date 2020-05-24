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

// Node.js API. We use quite a bit of it.
const assert = require('assert')
const path = require('path')
const url = require('url')
const processes = require('child_process')
const crypto = require('crypto')
const fs = require('fs').promises
const net = require('net')
const os = require('os')

// Do nothing.
const noop = require('nop')

// Return the first value that is not `null`ish.
const coalesce = require('extant')

// Convert events and callbacks to `async`/`await`.
const once = require('prospective/once')
const callback = require('prospective/callback')

// Delete directory and all its contents recursively.
const rimraf = require('rimraf')

// An `async`/`await` or synchronous queue with many heads.
const Queue = require('avenue')

// Non-cryptographic 32-bit checksum.
const fnv = require('hash.fnv')

// An `async`/`await` periodic executor.
const Isochronous = require('isochronous')

// Wrapped exceptions that you can catch by type.
const Interrupt = require('interrupt').create('prolific')

// Command line and environment interpretation utilities.
const inherit = require('prolific.inherit')

// Monitoring of streams that contain logging messages.
const Collector = require('prolific.collector')
const Watcher = require('prolific.watcher')

const Tmp = require('./tmp')
const Killer = require('./killer')
const Header = require('./header')

const Cubbyhole = require('cubbyhole')
const Vivifyer = require('vivifyer')

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
    const workers = destructible.durable('workers')

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

    // TODO Add a start time to the header so we can be certain that we're
    // deleting the send queue for a specific process.

    const senders = new Vivifyer(function () {
        return {
            paired: new Queue().shifter().paired,
            started: false,
            socketed: false,
            exited: false
        }
    })

    const sockets = new Queue().shifter().paired
    children.durable('sockets', async () => {
        for await (const entry of sockets.shifter.iterator()) {
            switch (entry.method) {
            case 'connect':
                // Move to server before queuing?
                try {
                    const header = await Header(entry.socket)
                    printer.say('header', { header })
                    if (header == null) {
                        console.log('NULL HEADER??')
                        // If we don't have a header, we should wait 250 ms or some
                        // such for a child that may come and go. We might set our
                        // countdown to zero, but we have a mystery to solve.
                        // TODO I dunno. That file really ought to be written to the
                        // temporary directory before the socket arrives, the
                        // temporary directory watcher loop shouldn't have a
                        // problem picking it up.
                        countdown.increment()
                        setTimeout(() => countdown.decrement(), 250)
                        // Ah, yes, we have no header because a short lived program
                        // has exited, and has not been flushed.
                    } else {
                        assert.equal(header.method, 'announce', 'announce missing')
                        // Vivify a sending queue.
                        const { pid, start } = header
                        const sender = senders.get(pid)
                        // We'll decrement the countdown once we know that the
                        // incomeing socket has been handled one way or another.
                        if (sender.exited) {
                            entry.socket.destroy()
                        } else {
                            sender.socketed = true
                            if (!sender.started) {
                                countdown.increment()
                            }
                            // Push the socket onto the sender queue.
                            sender.paired.queue.push({
                                message: { module: 'prolific', method: 'socket' },
                                socket: entry.socket
                            })
                            // TODO Why do we need a special killer just for the main
                            // child process. Wouldn't it be better to assume that
                            // everything is just anonymous?
                            // TODO I mean, really, why? It's annoying. Stop it.
                            // **TODO** Uncomment to hang unit test.
                            // throw new Error
                            printer.say('socketed', { header, destroyed: entry.socket.destroyed })
                        }
                    }
                } finally {
                    countdown.decrement()
                }
                break
            case 'exited': {
                    const { pid } = entry
                    printer.say('unsocketed', { pid })
                    senders.remove(pid)
                }
                break
            }
        }
    })
    children.destruct(() => sockets.queue.push(null))
    children.destruct(() => printer.say('destruct.children', {}))

    const server = net.createServer(socket => {
        countdown.increment()
        sockets.queue.push({ method: 'connect', socket })
    })
    children.destruct(() => server.close())
    await callback(callback => server.listen(path.resolve(tmp, 'socket'), callback))

    await fs.mkdir(path.resolve(tmp, 'stage'))
    await fs.mkdir(path.resolve(tmp, 'publish'))

    process.env.PROLIFIC_TMPDIR = tmp

    // A long running process might never touch its temporary directory until
    // the very end of the program. We don't want a temp directory cleanup
    // script to clean them up.
    const toucher = new Isochronous(60000, true, async () => {
        const now = Date.now()
        await fs.utimes(tmp, now, now)
        await fs.utimes(path.resolve(tmp, 'stage'), now, now)
        await fs.utimes(path.resolve(tmp, 'publish'), now, now)
    })

    children.durable('toucher', toucher.start())
    children.destruct(() => toucher.stop())

    // TODO Somehow, if the socket queue can drain, we know that we can close
    // all the existing sockets. Essentially, if the killer can reach zero, then
    // we know there are no processes, when the socket queue ends, we know there
    // are no lingering sockets, so we can then run this function with a timeout
    // of -1 or some such and ensure that all the sockets are removed.

    // But, we're fiddling with the countdown here, so...

    // Testing the pgid means testing the group first, if it errors we have to
    // test the pid and if it doesn't... Well, we're not going to know the pgid
    // of a process except for our child, so we can't really make any
    // assumptions unless we want to document those assumptions.

    const watcher = new Watcher(children.durable('watcher'), buffer => {
        return fnv(0, buffer, 0, buffer.length)
    }, path.join(tmp, 'publish'))
    countdown.destruct(() => watcher.drain())

    const killer = new Killer(100, printer)

    // Start is separate because we watch the start of main process separately,
    // we started it, while we receive child processes mysteriously.
    killer.on('killed', watcher.killed.bind(watcher))
    children.durable([ 'killer' ], killer.run())
    children.destruct(() => killer.destroy())

    const collector = new Collector

    // watcher.on('notice', notice => console.log(notice))

    watcher.on('data', data => collector.data(data))

    const argv = arguable.argv.slice()
    const main = argv.shift()

    // You keep wanting to turn this into an async function, but you really do
    // want the shutdowns to happen in parallel. Everything else about this
    // function is synchronous. Some of the message passing is asynchronous, but
    // that should have its own queue.

    //
    collector.on('data', data => {
        const { pid } = data
        switch (data.body.method) {
        case 'start': {
                // We ought get a start message if the user program compiles and
                // starts a shuttle. The shuttle itself should have no bugs and
                // should be able to write its start message into the temporary
                // directory. Program could crash before it starts a shuttle,
                // which is analogous to not compiling. After starting the
                // shuttle its like any other runtime error.
                console.log('STARTING')
                // Increment the countdown once for the child process.
                countdown.increment()
                // Increment the countdown once for the sidecar process.
                countdown.increment()
                // Start a sidecar.
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
                const destructible = children.ephemeral([ 'sidecar', pid ])
                function message (message) {
                    printer.say(message.method, message)
                    switch (message.method) {
                    case 'receiving': {
                            const sender = senders.get(pid)
                            sender.started = true
                            if (sender.socketed) {
                                countdown.decrement()
                            }
                            destructible.durable('socket', async function () {
                                for await (const entry of sender.paired.shifter.iterator()) {
                                    // TODO Wait on callback? Yes, we should
                                    // queue this and log if the queue gets too
                                    // big.
                                    sidecar.send(entry.message, coalesce(entry.socket))
                                }
                            })
                        }
                        break
                    case 'closed': {
                            killer.watch(message.child)
                        }
                        break
                    }
                }
                sidecar.on('message', message)
                sidecar.on('exit', () => sidecar.removeListener('message', message))
                sidecars[pid] = sidecar
                destructible.durable('process', supervise.sidecar(sidecar, pid))
            }
            break
        case 'say': {
                printer.push(data.body)
            }
            break
        case 'eos': {
                // Decrement once for the child process.
                countdown.decrement()
                // Get or create the sender.
                const sender = senders.get(pid)
                // Prevent a socket message from entering the queue.
                sender.exited = true
                // If we where not socketed, wait a bit for a socket that might
                // still be in the socket arrival queue. Highly unlikely that
                // this socket isn't already queued, though.
                sockets.queue.push({ method: 'exited', pid })
                // No exit code exit code for child processes.
                sender.paired.queue.push({
                    message: {
                        module: 'prolific',
                        method: 'synchronous',
                        body: null
                    }
                })
                // End the socket loop.
                sender.paired.queue.push(null)
                // Wait for exit.
                destructible.ephemeral('exit', async function () {
                    // Wait for exit signal.
                    const [ code, signal ] = await once(sidecars[pid], 'exit').promise
                    countdown.decrement()
                    delete sidecars[pid]
                })
            }
            break
        default: {
                // If we are getting entry messages from the child, the socket
                // has closed and its on its way toward an exit.
                killers.exit.watch(pid)
                // Forward the message to the sidecar.
                senders.get(pid).paired.queue.push({
                    message: {
                        module: 'prolific',
                        method: 'synchronous',
                        body: data.body
                    }
                })
            }
            break
        }
    })

    printer.say('start', {})

    function memory () {
        printer.say('supervisor.memory', {
            ...(process.memoryUsage()),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAverage: os.loadavg()
        })
    }
    memory()
    setInterval(memory, 45000).unref()

    const stdio = inherit(arguable)

    // TODO Restore inheritance.
    const child = processes.spawn(main, argv, { stdio: stdio })

    const traps = {}
    for (const signal of signals) {
        process.on(signal, traps[signal] = signal => {
            printer.say('trap', { signal })
            child.kill(signal)
        })
    }

    child.once('exit', () => countdown.decrement())

    const exit = once(child, 'exit').promise

    await children.destructed
    destructible.destroy()
    await destructible.destructed

    const [ code, signal ] = await exit
    for (const signal in traps) {
        process.removeListener(signal, traps[signal])
    }
    // TODO Beginning to seem iffy. Wouldn't it be better to report this to
    // standard out so it could be parsed?
    if (signal != null) {
        setInterval(noop, 1000)
        setImmediate(() => process.kill(process.pid, signal))
    }
    return code
})
