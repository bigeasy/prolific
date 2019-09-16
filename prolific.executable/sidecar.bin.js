/*
    ___ usage ___ en_US ___
    usage: node sidecar.bin.js

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
    const destructible = new Destructible('sidecar')

    // Node.js API.
    const assert = require('assert')

    const Consolidator = require('prolific.consolidator')

    const descendent = require('foremost')('descendent')

    descendent.process = arguable.options.process
    descendent.increment()
    try {
        const logger = require('prolific.logger').create('prolific')
        function memoryUsage () { logger.notice('memory', process.memoryUsage()) }
        memoryUsage()
        const interval = setInterval(memoryUsage, 1000)
        destructible.destruct(() => clearInterval(interval))

        const Processor = require('./processor')

        const processor = new Processor(arguable.ultimate.configuration)

        const Queue = require('avenue')
        const queue = new Queue

        const processors = new Queue().shifter().paired

        const Future = require('prospective/future')

        const receiving = new Future

        async function update () {
            for await (const processor of processors.shifter.iterator()) {
                arguable.pipes[3].write(JSON.stringify(processor) + '\n')
            }
        }

        descendent.on('prolific:socket', (message, socket) => {
            destructible.durable('read', update())
            destructible.durable('asynchronous', consolidator.asynchronous(socket, socket))
        })

        destructible.destruct(() => processors.shifter.destroy())

        processor.on('configuration', (configuration) => {
            receiving.resolve()
            processors.queue.push(configuration)
        })

        // Listen to our asynchronous pipe.
        const consolidator = new Consolidator(queue)

        destructible.durable('process', queue.shifter().pump(entry => {
            processor.process(entry)
        }))
        destructible.ephemeral('configure', processor.configure())

        descendent.on('prolific:synchronous', synchronous => {
            consolidator.synchronous(synchronous.body)
        })

        destructible.destruct(() => arguable.pipes[3].destroy())

        // Let the supervisor know that we're ready. It will send our asynchronous
        // pipe down to the monitored process.
        descendent.up(+arguable.ultimate.supervisor, 'prolific:receiving', process.pid)

        await destructible.promise

        return 0
    } finally {
        descendent.decrement()
        descendent.process = process
    }
})
