/*
    ___ usage ___ en_US ___
    usage: node sidecar.bin.js

        -p, --processor <string>        processor path
        -s, --supervisor <string>       pid of supervisor
        -t, --tmp <string>              path of temporary directory
        -c, --child <string>            monitored pid
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

    const Consolidator = require('prolific.consolidator')

    const Logger = require('./logger')

    const tmp = arguable.ultimate.tmp

    const logger = new Logger(destructible.durable('logger'), Date, tmp, process.pid, 1000)
    logger.say('sidecar.start', { tmp })

    const _logger = require('prolific.logger').create('prolific')
    function memoryUsage () { _logger.notice('memory', process.memoryUsage()) }
    memoryUsage()
    const interval = setInterval(memoryUsage, 1000)
    destructible.destruct(() => clearInterval(interval))

    const Processor = require('./processor')

    const processor = new Processor(arguable.ultimate.processor)

    const Queue = require('avenue')
    const queue = new Queue

    const processors = new Queue().shifter().paired

    async function update (socket) {
        for await (const processor of processors.shifter.iterator()) {
            logger.say('processor.send', { processor })
            socket.write(JSON.stringify(processor) + '\n')
        }
    }

    destructible.destruct(() => processors.shifter.destroy())

    processor.on('processor', (processor) => {
        logger.say('processor.load', { processor })
        processors.queue.push(processor)
    })

    // Listen to our asynchronous pipe.
    const consolidator = new Consolidator(queue)

    destructible.durable('process', queue.shifter().pump(chunk => {
        processor.process(chunk)
    }))
    destructible.ephemeral('configure', processor.configure())

    function message (message, socket) {
        switch (`${message.module}:${message.method}`) {
        case 'prolific:socket':
            logger.say('sidecar.socket', { message, socket: !! socket })
            if (socket != null) {
                socket.on('error', error => {
                    logger.say('socket.error', { stack: error.stack })
                })
                destructible.ephemeral('read', update(socket))
                destructible.ephemeral('asynchronous', consolidator.asynchronous(socket, socket))
            }
            break
        case 'prolific:synchronous':
            logger.say('processor.synchronous', { message })
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

    await destructible.promise

    return 0
})
