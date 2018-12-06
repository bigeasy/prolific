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
    require('prolific.sink').properties.pid = 1

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
                    body: {
                        buffer: JSON.stringify({
                            when: 0,
                            qualifier: 'qualifier',
                            label: 'label',
                            level: 'error',
                            body: { url: '/' },
                            system: { pid: 0 }
                        }) + '\n'
                    }
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
                    body: {
                        buffer: JSON.stringify({
                            when: 0,
                            qualifier: 'qualifier',
                            label: 'label',
                            level: 'info',
                            body: { url: '/' },
                            system: { pid: 0 }
                        }) + '\n'
                    }
                }, async())
            }, function () {
                require('prolific.sink').json('error', 'qualifier', 'label', { when: 0, a: 1 })
                okay(gather.queue.shift(), {
                    when: 0,
                    level: 'error',
                    qualifier: 'qualifier',
                    label: 'label',
                    qualified: 'qualifier#label',
                    pid: 1,
                    a: 1
                }, 'local logging with set time')
                require('prolific.sink').json('error', 'qualifier', 'label', { when: 0 })
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
                    body: {
                        buffer:
                            JSON.stringify([{ version: 0 }]) + '\n' +
                            JSON.stringify({ level: 'error', when: 0, url: '/', pid: 0 })
                    }
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
