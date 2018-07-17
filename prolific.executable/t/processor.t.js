require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Processor = require('../processor')
    var path = require('path')

    var cadence = require('cadence')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/processor.t')

    var configuration = {
        template: path.join(__dirname, 'configuration.json'),
        copy: path.join(__dirname, 'configuration.copy.json')
    }

    var fs = require('fs')

    fs.copyFileSync(configuration.template, configuration.copy)

    var wait = null

    function reloaded (configuration) {
        console.log(configuration)
        wait()
    }

    var entries = require('prolific.test').entries

    destructible.completed.wait(async())

    async([function () {
        destructible.destroy()
    }], function () {
        destructible.monitor('test', cadence(function (async, destructible) {
            async(function () {
                destructible.monitor('proessor', Processor, configuration.copy, reloaded, async())
            }, function (processor) {
                async(function () {
                    processor.process({
                        body: {
                            buffer: ([
                                [{ qualifier: 'prolific', level: 'debug' }, { key: 'value' }],
                                [{ qualifier: 'prolific', level: 'warn' }, { key: 'value' }]
                            ]).map(JSON.stringify).join('\n')
                        }
                    }, async())
                }, function () {
                    okay(entries.shift(), { qualifier: 'prolific', level: 'warn', key: 'value' }, 'process')
                    wait = async()
                    processor.reload()
                }, function () {
                    processor.process({
                        body: {
                            buffer: ([
                                [{ qualifier: 'prolific', level: 'debug' }, { key: 'value' }],
                                [{ version: 0 }],
                                [{ qualifier: 'prolific', level: 'warn' }, { key: 'value' }]
                            ]).map(JSON.stringify).join('\n') + '\n'
                        }
                    }, async())
                }, function () {
                    processor.reload()
                    fs.unlinkSync(configuration.copy)
                    setTimeout(async(), 250)
                })
            }, function () {
                return []
            })
        }), async())
    })
}
