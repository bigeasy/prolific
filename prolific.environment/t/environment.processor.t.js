require('proof')(1, prove)

function prove (okay, callback) {
    var Processor = require('../environment.processor')
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
                static: { once: '1' },
                dynamic: { each: '1' }
            }, sink, async())
        }, function (processor) {
            processor.process({
                env: {},
                json: {}
            })
            okay(processed.splice(0), [{
                json: {},
                env: { once: 1, each: 1 }
            }], 'environment')
        })
    })(destructible.monitor('test'))
}
