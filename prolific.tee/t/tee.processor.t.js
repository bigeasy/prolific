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

    var entry = { level: 'info', json: { a: 1, qualifier: 'module' } }
    async([function () {
        destructible.destroy()
    }], function () {
        destructible.monitor('tee', Tee, { pipeline: [] }, nextProcessor, async())
    }, function (processor) {
        processor.process(entry)
        okay(processed.shift(), entry, 'processed')
        destructible.monitor('tee', Tee, {
            accept: false,
            chain: [{ accept: true, path: '.other' }],
            pipeline: [],
            consume: true
        }, nextProcessor, async())
    }, function (processor) {
        processor.process({ level: 7, json: { a: 1, qualifier: 'other' } })
        processor.process(entry)
        okay(processed, [ entry ], 'consumed')
    })
}
