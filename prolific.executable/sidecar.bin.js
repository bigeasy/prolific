/*
    ___ usage ___ en_US ___
    usage: node sidecar.bin.js

        -c, --configuration <string>    json configuration path
        -s, --supervisor <string>       pid of supervisor
            --help                      display this message

    ___ . ___
*/
require('arguable')(module, {
    $trap: { SIGINT: 'swallow', SIGTERM: 'swallow' },
    process: process
}, async (arguable) => {
    arguable.required('configuration', 'supervisor')

    const Destructible = require('destructible')
    const destructible = new Destructible('sidecar')

    // Node.js API.
    const assert = require('assert')

    const Consolidator = require('prolific.consolidator')

    const descendant = require('foremost')('descendant')

    const Logger = require('./logger')

    const PROLIFIC_TMPDIR = arguable.options.process.env.PROLIFIC_TMPDIR

    const logger = new Logger(destructible.durable('logger'), Date, PROLIFIC_TMPDIR, process.pid, 1000)
    logger.say('sidecar.start', { PROLIFIC_TMPDIR })

    descendant.process = arguable.options.process
    descendant.increment()
    destructible.destruct(() => descendant.decrement())
    destructible.destruct(() => descendant.process = process)
    const _logger = require('prolific.logger').create('prolific')
    function memoryUsage () { _logger.notice('memory', process.memoryUsage()) }
    memoryUsage()
    const interval = setInterval(memoryUsage, 1000)
    destructible.destruct(() => clearInterval(interval))

    const Processor = require('./processor')

    const processor = new Processor(arguable.ultimate.configuration)

    const Queue = require('avenue')
    const queue = new Queue

    const processors = new Queue().shifter().paired

    const Future = require('prospective/future')

    async function update (socket) {
        for await (const processor of processors.shifter.iterator()) {
            logger.say('processor.send', { processor })
            socket.write(JSON.stringify(processor) + '\n')
        }
    }

    descendant.on('prolific:socket', (message, socket) => {
        logger.say('sidecar.socket', { message, socket: !! socket, connected: process.connected })
        destructible.ephemeral('read', update(socket))
        destructible.ephemeral('asynchronous', consolidator.asynchronous(socket, socket))
    })

    destructible.destruct(() => processors.shifter.destroy())

    processor.on('configuration', (processor) => {
        logger.say('processor.load', { processor })
        processors.queue.push(processor)
    })

    // Listen to our asynchronous pipe.
    const consolidator = new Consolidator(queue)

    destructible.durable('process', queue.shifter().pump(chunk => {
        logger.say('processor.chunk', { chunk })
        processor.process(chunk)
    }))
    destructible.ephemeral('configure', processor.configure())

    descendant.on('prolific:synchronous', synchronous => {
        consolidator.synchronous(synchronous.body)
    })

    // Let the supervisor know that we're ready. It will send our asynchronous
    // pipe down to the monitored process.
    descendant.up(+arguable.ultimate.supervisor, 'prolific:receiving', process.pid)

    await destructible.promise

    return 0
})
