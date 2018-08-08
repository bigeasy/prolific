require('proof')(2, require('cadence')(prove))

function prove (async, okay) {
    var Tee = require('..')

    var processed = []
    var nextProcessor = {
        process: function (entry) {
            processed.push(entry)
        }
    }

    var Destructible = require('destructible')
    var destructible = new Destructible('t/tee.processor.t')

    async([function () {
        destructible.destroy()
    }], function () {
        destructible.monitor('tee', Tee, { pipeline: [] }, nextProcessor, async())
    }, function (processor) {
        processor.process({ a: 1 })
        okay(processed.shift(), { a: 1 }, 'processed')
        destructible.monitor('tee', Tee, { pipeline: [], consume: true }, nextProcessor, async())
    }, function (processor) {
        processor.process({ a: 1 })
        okay(processed.length, 0, 'consumed')
    })
}
