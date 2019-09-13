describe('processor', () => {
    const assert = require('assert')
    const path = require('path')
    const fs = require('fs').promises

    const sink = require('prolific.sink')

    const Destructible = require('destructible')

    const Processor = require('../processor')

    sink.Date = { now: () => 1 }
    sink.properties.pid = 2

    const configuration = {
        configuration: path.join(__dirname, 'configuration.initial.js'),
        bad: path.join(__dirname, 'configuration.bad.js'),
        reconfiguration: path.join(__dirname, 'configuration.subsequent.js'),
        objectconfiguration: path.join(__dirname, 'configuration.object.js'),
        source: path.join(__dirname, 'configuration.js')
    }

    it('can configure', async () => {
        const sink = require('prolific.sink')

        const destructible = new Destructible('configure')
        const gather = require('./gather')

        await fs.copyFile(configuration.configuration, configuration.source)

        const processor = new Processor(configuration.source, { now: () => 1 })
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
            processor.once('configuration', configuration => {
                test.push(configuration)
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
            processor.once('configuration', configuration => {
                test.push(configuration)
                resolve()
            })
        })
        await fs.copyFile(configuration.bad, configuration.source)
        await new Promise(resolve => {
            processor.once('error', error => {
                test.push('bad configure')
                resolve()
            })
        })
        await fs.copyFile(configuration.reconfiguration, configuration.source)
        await reconfigured
        const configured = { object: null, subsequent: null }
        configured.object = new Promise(resolve => {
            processor.once('configuration', configuration => {
                test.push(configuration)
                resolve()
            })
        })
        await fs.copyFile(configuration.objectconfiguration, configuration.source)
        await configured.object
        assert(!processor.destroyed, 'not destroyed')
        await processor.process({ method: 'exit' })
        await processor.process(null)
        assert(processor.destroyed, 'destroyed')
        assert.deepStrictEqual(test, [{
            version: 0,
            source: await fs.readFile(configuration.configuration, 'utf8'),
            file: configuration.source
        }, 'bad configure', {
            version: 1,
            source: await fs.readFile(configuration.reconfiguration, 'utf8'),
            file: configuration.source
        }, {
            version: 2,
            source: await fs.readFile(configuration.objectconfiguration, 'utf8'),
            file: configuration.source
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
