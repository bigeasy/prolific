require('proof')(16, async (okay) => {
    const path = require('path')
    const fs = require('fs').promises

    const sink = require('prolific.sink')

    const Destructible = require('destructible')

    const Processor = require('../processor')

    const ProcessorConfigurator = require('../configurator')
    const Reconfigurator = require('reconfigure')

    const assert = require('assert')

    sink.Date = { now: () => 1 }
    sink.properties.pid = 2

    class PausableReconfigurator extends Reconfigurator {
        constructor (processor, application) {
            super(processor, application)
            this.unshifted = []
        }
        unshift (buffer) {
            this.unshifted.push(buffer)
        }
        forwardUnshift () {
            super.unshift(this.unshifted.shift())
        }
        superUnshift (buffer) {
            super.unshift(buffer)
        }
    }

    const processors = {
        initial: path.join(__dirname, 'processor.initial.js'),
        bad: path.join(__dirname, 'processor.bad.js'),
        error: path.join(__dirname, 'processor.error.js'),
        errored: path.join(__dirname, 'processor.errored.js'),
        terminated: path.join(__dirname, 'processor.terminated.js'),
        source: path.join(__dirname, 'processor.js')
    }

    const test = []
    const gather = require('./gather')

    {
        const logger = {
            say: (...vargs) => console.log('said', vargs)
        }
        const destructible = new Destructible('configure')
        await fs.copyFile(processors.bad, processors.source)
        const configurator = new ProcessorConfigurator(logger, processors.source, __filename)
        const reconfigurator = new PausableReconfigurator(processors.source, configurator)
        const processor = new Processor(logger, reconfigurator, { now: () => 1 })
        try {
            await destructible.attemptable('test', async function () {
                await destructible.awaitable('configure', processor.configure())
            })
        } catch (error) {
            okay(error instanceof Destructible.Error, 'configuration error')
            okay(error.causes[0] instanceof assert.AssertionError, 'assertion failed')
        }
    }
    {
        const events = []
        const said = []
        const logger = {
            say: (...vargs) => {
                said.push(vargs)
            }
        }
        const destructible = new Destructible('configure')
        // Wait a bit for this to write or else we'll get a change event from
        // the FSWatcher in Reconfigurable.
        await fs.copyFile(processors.initial, processors.source)
        await new Promise(resolve => setTimeout(resolve, 50))
        const configurator = new ProcessorConfigurator(logger, processors.source, __filename)
        const reconfigurator = new PausableReconfigurator(processors.source, configurator)
        const processor = new Processor(logger, reconfigurator, { now: () => 1 })
        processor.on('processor', (event) => events.push(event))
        await destructible.attemptable('test', async function () {
            await destructible.awaitable('configure', processor.configure())
            destructible.durable('reconfigure', processor.reconfigure())
            try {
                processor.process({
                    method: 'entries',
                    entries: [{
                        when: 0,
                        qualifier: 'qualifier',
                        label: 'label',
                        level: 'error',
                        body: { url: '/' },
                        system: { pid: 0 }
                    }, {
                        when: 0,
                        qualifier: 'qualifier',
                        label: 'label',
                        level: 'info',
                        body: { url: '/info' },
                        system: { pid: 0 }
                    }]
                })
                okay(gather.splice(0), [{
                        when: 0,
                        qualifier: 'qualifier',
                        label: 'label',
                        level: 'error',
                        body: { url: '/' },
                        system: { pid: 0 }
                }], 'load filter all')
                await processor.process({
                    method: 'entries',
                    entries: [{
                        when: 0,
                        qualifier: 'qualifier',
                        label: 'label',
                        level: 'info',
                        body: { url: '/info' },
                        system: { pid: 0 }
                    }]
                })
                okay(gather.splice(0), [], 'load triage')
                sink.json('error', 'recirculation', 'message', {}, {})
                okay(gather.splice(0), [{
                    when: 1,
                    level: 'error',
                    qualifier: 'recirculation',
                    label: 'message',
                    body: {},
                    system: {}
                }], 'sink')
                await processor.process({ method: 'entries', entries: [] })
                okay(gather.splice(0), [], 'process empty array')
                reconfigurator.forwardUnshift()
                await new Promise(resolve => setTimeout(resolve, 50))
                okay(events.splice(0), [{
                    version: 0,
                    source: await fs.readFile(processors.source, 'utf8'),
                    resolved: {
                        filename: processors.source,
                        __filename: processors.source
                    }
                }], 'first reload')
                await processor.process({ method: 'version', version: 0 })
                await processor.process({
                    method: 'entries',
                    entries: [{
                        when: 0,
                        qualifier: 'qualifier',
                        label: 'label',
                        level: 'info',
                        body: { url: '/info' },
                        system: { pid: 0 }
                    }]
                })
                okay(gather.splice(0), [{
                    when: 0,
                    qualifier: 'qualifier',
                    label: 'label',
                    level: 'info',
                    body: { url: '/info' },
                    system: { pid: 0 }
                }], 'non triaged')
                reconfigurator.superUnshift(Buffer.from('x.x'))
                await new Promise(resolve => setTimeout(resolve, 50))
                okay(said.shift()[0], 'configure', 'bad source')
                reconfigurator.superUnshift(await fs.readFile(processors.error))
                await new Promise(resolve => setTimeout(resolve, 50))
                await processor.process({ method: 'version', version: 1 })
                await processor.process({
                    method: 'entries',
                    entries: [{
                        when: 0,
                        qualifier: 'qualifier',
                        label: 'label',
                        level: 'error',
                        body: { url: '/' },
                        system: { pid: 0 }
                    }]
                })
                okay(said.shift()[0], 'process.error', 'processing error')
                reconfigurator.superUnshift(await fs.readFile(processors.errored))
                await new Promise(resolve => setTimeout(resolve, 50))
                await processor.process({ method: 'version', version: 2 })
                okay(said.shift()[0], 'background.error', 'background error')
                await processor.process({
                    method: 'entries',
                    entries: [{}]
                })
                await new Promise(resolve => setImmediate(resolve))
                reconfigurator.superUnshift(await fs.readFile(processors.terminated))
                await new Promise(resolve => setTimeout(resolve, 50))
                await processor.process({ method: 'version', version: 3 })
                okay(said.shift(), [ 'dropped', { dropped: 1 } ], 'background error dropped')
                await processor.process({
                    method: 'entries',
                    entries: [{}]
                })
                okay(said.shift()[0], 'terminated', 'terminated error')
                reconfigurator.superUnshift(await fs.readFile(processors.initial))
                await new Promise(resolve => setTimeout(resolve, 50))
                await processor.process({ method: 'version', version: 4 })
                okay(said.shift(), [ 'dropped', { dropped: 1 } ], 'temrinated dropped')
                reconfigurator.superUnshift(await fs.readFile(processors.initial))
                await new Promise(resolve => setTimeout(resolve, 50))
                reconfigurator.superUnshift(await fs.readFile(processors.initial))
                await processor.process(null)
                okay(gather.splice(0), [{
                    when: 1,
                    level: 'panic',
                    qualifier: 'prolific',
                    label: 'eos',
                    body: {},
                    system: { pid: 2 }
                }], 'eos')
                okay(said, [], 'no more logging messages')
            } catch (error) {
                console.log(error.stack)
                throw error
            }
        })
    }
})
