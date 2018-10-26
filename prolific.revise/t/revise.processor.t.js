require('proof')(1, prove)

function prove (okay, callback) {
    var Processor = require('../revise.processor')
    var Destructible = require('destructible')
    var destructible = new Destructible('t/extract.processor.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var processed = []
    var sink = {
        process: function (entry) { processed.push(entry) }
    }

    cadence(function (async) {
        async(function () {
            destructible.monitor('processor', Processor, {
                revise: 'delete $.value'
            }, sink, async())
        }, function (processor) {
            processor.process({
                when: 0,
                formatted: [],
                level: 0,
                json: {
                    qualified: 'example#message',
                    level: 'info',
                    when: 0,
                    pid: 0,
                    value: 1
                }
            })
            okay(processed.splice(0), [{
                level: 6,
                formatted: [],
                json: {
                    qualified: 'example#message',
                    qualifier: 'example',
                    label: 'message',
                    level: 'info',
                    when: 0,
                    pid: 0
                }
            }], 'revise')
        })
    })(destructible.monitor('test'))
}
