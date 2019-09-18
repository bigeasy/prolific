describe('processor', () => {
    const assert = require('assert')
    const path = require('path')
    const fs = require('fs').promises

    const sink = require('prolific.sink')

    const Destructible = require('destructible')

    const Processor = require('../processor')

    sink.Date = { now: () => 1 }
    sink.properties.pid = 2

    const processors = {
        configuration: path.join(__dirname, 'processor.initial.js'),
        bad: path.join(__dirname, 'processor.bad.js'),
        reconfiguration: path.join(__dirname, 'processor.subsequent.js'),
        objectconfiguration: path.join(__dirname, 'processor.object.js'),
        source: path.join(__dirname, 'processor.js')
    }

    it('can configure', async () => {
        const sink = require('prolific.sink')

        const destructible = new Destructible('configure')
        const gather = require('./gather')

        await fs.copyFile(processors.configuration, processors.source)

        const processor = new Processor(processors.source, { now: () => 1 })
        processor.on('error', error => console.log(error.stack))
        sink.json('error', 'prolific', 'label', {}, { pid: 1 })
        await processor.process({
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
        const test = []
        destructible.durable('configure', processor.configure(), () => processor.destroy())
        await new Promise(resolve => {
            processor.once('processor', processor => {
                test.push(processor)
                resolve()
            })
        })
        await processor.process({ method: 'version', version: 0 })
        await processor.process({
            method: 'entries',
            entries: [{
                when: 0,
                qualifier: 'qualifier',
                label: 'label',
                level: 'error',
                body: { url: '/after' },
                system: { pid: 0 }
            }]
        })
        sink.json('error', 'prolific', 'label', {}, { pid: 1 })
        const reconfigured = new Promise(resolve => {
            processor.once('processor', processor => {
                test.push(processor)
                resolve()
            })
        })
        await fs.copyFile(processors.bad, processors.source)
        await new Promise(resolve => {
            processor.once('error', error => {
                test.push('bad configure')
                resolve()
            })
        })
        await fs.copyFile(processors.reconfiguration, processors.source)
        await reconfigured
        const configured = { object: null, subsequent: null }
        configured.object = new Promise(resolve => {
            processor.once('processor', processor => {
                test.push(processor)
                resolve()
            })
        })
        await fs.copyFile(processors.objectconfiguration, processors.source)
        await configured.object
        assert(!processor.destroyed, 'not destroyed')
        await processor.process({ method: 'exit' })
        await processor.process(null)
        assert(processor.destroyed, 'destroyed')
        assert.deepStrictEqual(test, [{
            version: 0,
            source: await fs.readFile(processors.configuration, 'utf8'),
            file: processors.source
        }, 'bad configure', {
            version: 1,
            source: await fs.readFile(processors.reconfiguration, 'utf8'),
            file: processors.source
        }, {
            version: 2,
            source: await fs.readFile(processors.objectconfiguration, 'utf8'),
            file: processors.source
        }], 'configuration')
        assert.deepStrictEqual(gather, [[{
            when: 1,
            qualifier: 'prolific',
            label: 'label',
            level: 'error',
            body: {},
            system: { pid: 1 }
        }], [{
            when: 0,
            qualifier: 'qualifier',
            label: 'label',
            level: 'error',
            body: { url: '/' },
            system: { pid: 0 }
        }], [{
            when: 0,
            qualifier: 'qualifier',
            label: 'label',
            level: 'error',
            body: { url: '/after' },
            system: { pid: 0 }
        }], [{
            when: 1,
            qualifier: 'prolific',
            label: 'label',
            level: 'error',
            body: {},
            system: { pid: 1 }
        }]], 'gather')
        processor.destroy()
        return
    })
})
