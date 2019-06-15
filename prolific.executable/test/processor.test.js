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
        template: path.join(__dirname, 'configuration.js'),
        copy: path.join(__dirname, 'configuration.copy.js'),
        bad: path.join(__dirname, 'configuration.bad.js'),
        missing: path.join(__dirname, 'configuration.missing.js')
    }

    it('can configure', async () => {
        const destructible = new Destructible('configure')

        await fs.copyFile(configuration.template, configuration.copy)

        const processor = new Processor(configuration.copy)
        const test = []
        destructible.durable('configure', processor.configure(), () => processor.destroy())
        await new Promise(resolve => {
            processor.on('configuration', configuration => {
                test.push(configuration)
                resolve()
            })
        })
        assert.deepStrictEqual(test, [{
            version: 0,
            source: await fs.readFile(configuration.template, 'utf8')
        }], 'test')
        assert(!processor.destroyed, 'not destroyed')
        processor.destroy()
        assert(processor.destroyed, 'destroyed')
    })
})
return
require('proof')(5, prove)

function prove (okay, callback) {
    var Processor = require('../processor')
    var path = require('path')

    var cadence = require('cadence')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/processor.t')

    var configuration = {
        template: path.join(__dirname, 'configuration.js'),
        copy: path.join(__dirname, 'configuration.copy.js'),
        bad: path.join(__dirname, 'configuration.bad.js'),
        missing: path.join(__dirname, 'configuration.missing.js')
    }

    var fs = require('fs')
    var fse = require('fs-extra')

    fse.copySync(configuration.template, configuration.copy)

    var wait = null

    var reloads = [function (configuration) {
        okay({
            version: configuration.version,
            triage: configuration.triage.substring(0, 8)
        }, {
            version: 0,
            triage:  'function'
        }, 'reloaded')
        wait()
    }, function () {
        wait()
    }]

    function reloaded (configuration) {
        reloads.shift()(configuration)
    }

    destructible.completed.wait(callback)

    require('prolific.sink').Date = { now: function () { return 1 } }
    require('prolific.sink').properties.pid = 2

    var gather = require('prolific.gather')

    cadence(function (async) {
        async(function () {
            // Exercise a cancel of the very first read.
            destructible.ephemeral('missing', cadence(function (async, destructible) {
                destructible.durable('processor', Processor, configuration.missing, reloaded, async())
                setTimeout(function () { destructible.destroy() })
            }), async())
        }, function (processor) {
            destructible.durable('processor', Processor, configuration.copy, reloaded, async())
        }, function (processor) {
            async(function () {
                processor.process({
                    body: [{
                        when: 0,
                        qualifier: 'qualifier',
                        label: 'label',
                        level: 'error',
                        body: { url: '/' },
                        system: { pid: 0 }
                    }]
                }, async())
            }, function () {
                okay(gather.queue.splice(0), [{
                    when: 0,
                    level: 'error',
                    qualified: 'qualifier#label',
                    qualifier: 'qualifier',
                    label: 'label',
                    pid: 0,
                    url: '/'
                }], 'triage in monitor')
                processor.process({
                    body: [{
                        when: 0,
                        qualifier: 'qualifier',
                        label: 'label',
                        level: 'info',
                        body: { url: '/' },
                        system: { pid: 0 }
                    }]
                }, async())
            }, function () {
                require('prolific.sink').json('error', 'qualifier', 'label', { when: 0, a: 1 }, { pid: 1 })
                okay(gather.queue.shift(), {
                    when: 0,
                    level: 'error',
                    qualifier: 'qualifier',
                    label: 'label',
                    qualified: 'qualifier#label',
                    pid: 1,
                    a: 1
                }, 'local logging with set time')
                require('prolific.sink').json('error', 'qualifier', 'label', { when: 0 }, { pid: 1 })
                okay(gather.queue.shift(), {
                    when: 0,
                    level: 'error',
                    qualifier: 'qualifier',
                    label: 'label',
                    qualified: 'qualifier#label',
                    pid: 1
                }, 'local logging')
            }, function () {
                wait = async()
            }, function () {
                processor.process({
                    body: [
                        [{ method: 'version', version: 0 }],
                        { level: 'error', when: 0, url: '/', pid: 0 }
                    ]
                }, async())
                okay(gather.queue.splice(0), [{
                    level: 'error', when: 0, pid: 0, url: '/'
                }], 'triage in processor')
            }, function () {
                wait = async()
                fse.copySync(configuration.bad, configuration.copy)
                setTimeout(function () {
                    fse.copySync(configuration.template, configuration.copy)
                }, 250)
            }, function () {
                processor.process({ canceled: true }, async())
            })
        })
    })(destructible.durable('test'))
}
