/*
    ___ usage ___ en_US ___
    usage: node monitor.bin.js

        -c, --configuration <string>    json configuration path
        -s, --supervisor <string>       pid of supervisor
            --help                      display this message

    ___ . ___
*/
require('arguable')(module, {
    $pipes: { 3: { readable: true } },
    $trap: { SIGINT: 'swallow', SIGTERM: 'swallow' },
    process: process
}, async (arguable) => {
    arguable.required('configuration', 'supervisor')

    const Destructible = require('destructible')
    const destructible = new Destructible('monitor')

    // Node.js API.
    const assert = require('assert')

    const Consolidator = require('prolific.consolidator')

    const descendent = require('foremost')('descendent')

    descendent.process = arguable.options.process
    descendent.increment()
    try {
        const logger = require('prolific.logger').createLogger('prolific')
        function memoryUsage () { logger.notice('memory', process.memoryUsage()) }
        memoryUsage()
        const interval = setInterval(memoryUsage, 1000)
        destructible.destruct(() => clearInterval(interval))

        const Processor = require('./processor')

        const processor = new Processor(arguable.ultimate.configuration)

        processor.on('configuration', (configuration) => {
            descendent.up(+arguable.ultimate.supervisor, 'prolific:accept', configuration)
        })

        const Queue = require('avenue')
        const queue = new Queue

        // Listen to our asynchronous pipe.
        const consolidator = new Consolidator(arguable.pipes[3], arguable.pipes[3], queue)

        destructible.durable('process', queue.shifter().pump(batch => processor.process(batch)))
        destructible.ephemeral('configure', processor.configure())
        destructible.durable('asynchronous', consolidator.asynchronous())

        descendent.on('prolific:synchronous', synchronous => {
            console.log('>', synchronous.body)
            consolidator.synchronous(synchronous.body)
        })

        destructible.destruct(() => arguable.pipes[3].destroy())

        // Let the supervisor know that we're ready. It will send our asynchronous
        // pipe down to the monitored process.
        descendent.up(+arguable.ultimate.supervisor, 'prolific:pipe', true)

        await destructible.promise

        return 0
    } finally {
        descendent.decrement()
        descendent.process = process
    }
})
