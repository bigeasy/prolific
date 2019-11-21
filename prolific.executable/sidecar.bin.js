/*
    ___ usage ___ en_US ___
    usage: node sidecar.bin.js

        -p, --processor <string>        processor path
        -s, --supervisor <string>       pid of supervisor
        -t, --tmp <string>              path of temporary directory
        -c, --child <string>            monitored pid
        -m, --main <string>             source of child process
            --help                      display this message

    ___ . ___
*/
require('arguable')(module, {
    $trap: { SIGINT: 'swallow', SIGTERM: 'swallow' },
    process: process
}, async (arguable) => {
    arguable.required('processor', 'supervisor')

    const Destructible = require('destructible')
    const destructible = new Destructible('sidecar')

    // Node.js API.
    const assert = require('assert')
    const os = require('os')

    const Consolidator = require('prolific.consolidator')

    const Logger = require('./logger')

    const tmp = arguable.ultimate.tmp

    const logger = new Logger(destructible.durable('logger'), Date, tmp, process.pid, 1000)
    logger.say('sidecar.start', { tmp })

    function memory () {
        logger.say('sidecar.memory', {
            ...(process.memoryUsage()),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAverage: os.loadavg()
        })
    }
    memory()
    setInterval(memory, 45000).unref()


    const _logger = require('prolific.logger').create('prolific')
    function memoryUsage () { _logger.notice('memory', process.memoryUsage()) }
    memoryUsage()
    const interval = setInterval(memoryUsage, 1000)
    destructible.destruct(() => clearInterval(interval))

    const Processor = require('./processor', arguable.ultimate.main)

    const processor = new Processor(arguable.ultimate.processor, arguable.ultimate.main, logger)

    const Queue = require('avenue')
    const queue = new Queue

    const processors = new Queue().shifter().paired

    async function update (socket) {
        for await (const processor of processors.shifter.iterator()) {
            logger.say('sidecar.triage', { processor })
            socket.write(JSON.stringify({ method: 'triage', processor }) + '\n')
        }
    }

    destructible.destruct(() => processors.shifter.destroy())

    processor.on('processor', (processor) => {
        logger.say('sidecar.processor', { processor })
        processors.queue.push(processor)
    })

    // Listen to our asynchronous pipe.
    const consolidator = new Consolidator(queue)

    destructible.durable('process', queue.shifter().pump(chunk => processor.process(chunk)))
    destructible.ephemeral('configure', processor.configure())

    function message (message, socket) {
        switch (`${message.module}:${message.method}`) {
        case 'prolific:socket':
            const listeners = [ 'end', 'close' ]
            const closed = () => {
                for (const listener of listeners) {
                    socket.removeListener(listener, closed)
                }
                arguable.options.process.send({
                    module: 'prolific',
                    method: 'closed',
                    child: +arguable.ultimate.child
                })
            }
            logger.say('sidecar.socket', { message, socket: !! socket })
            if (socket == null) {
                listeners.length = 0
                closed()
            } else {
                for (const listener of listeners) {
                    socket.on(listener, closed)
                }
                socket.on('error', error => {
                    logger.say('socket.error', { stack: error.stack })
                })
                destructible.ephemeral('read', update(socket))
                destructible.ephemeral('asynchronous', consolidator.asynchronous(socket, socket))
            }
            break
        case 'prolific:synchronous':
            logger.say('sidecar.synchronous', { message })
            consolidator.synchronous(message.body)
            break
        }
    }
    arguable.options.process.on('message', message)
    destructible.destruct(() => arguable.options.process.removeListener('message', message))

    // Let the supervisor know that we're ready. It will send our asynchronous
    // pipe down to the monitored process.
    arguable.options.process.send({
        module: 'prolific',
        method: 'receiving',
        child: +arguable.ultimate.child
    })

    await destructible.destructed

    return 0
})
