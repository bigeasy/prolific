require('proof')(1, require('cadence')(prove))

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
        okay(processed, [{ a: 1 }], 'processed')
    })
}
