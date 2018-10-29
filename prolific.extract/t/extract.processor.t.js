require('proof')(2, prove)

function prove (okay, callback) {
    var Processor = require('../extract.processor')
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
                consume: true,
                extract: {
                    'specific#message': '{ key: $.value }'
                }
            }, sink, async())
        }, function (processor) {
            processor.process({
                when: 0,
                formatted: [],
                level: 0,
                json: {
                    when: 0,
                    pid: 0,
                    value: 1
                }
            })
            okay(processed.splice(0), [{
                level: 5,
                formatted: [],
                json: {
                    key: 1,
                    qualified: 'specific#message',
                    qualifier: 'specific',
                    label: 'message',
                    level: 'notice',
                    when: 0,
                    pid: 0
                }
            }], 'consume')
        }, function () {
            destructible.monitor('processor', Processor, {
                qualifier: 'example',
                extract: {
                    message: '{ key: $.value }'
                }
            }, sink, async())
        }, function (processor) {
            processor.process({
                when: 0,
                formatted: [],
                level: 0,
                json: {
                    when: 0,
                    pid: 0,
                    value: 1
                }
            })
            okay(processed.splice(0), [{
                level: 5,
                formatted: [],
                json: {
                    key: 1,
                    qualified: 'example#message',
                    qualifier: 'example',
                    label: 'message',
                    level: 'notice',
                    when: 0,
                    pid: 0
                }
            }, {
                when: 0,
                formatted: [],
                level: 0,
                json: {
                    when: 0,
                    pid: 0,
                    value: 1
                }
            }], 'inject')
        })
    })(destructible.monitor('test'))
}
