require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../tee.processor')
    var processed = []
    var processor = new Processor({
        configuration: { processors: [] }
    }, {
        process: function (entry) {
            processed.push(entry)
        }
    })
    async(function () {
        processor.open(async())
    }, function () {
        processor.process({ a: 1 })
    }, function () {
        processor.close(async())
    }, function () {
        assert(processed, [{ a: 1 }], 'processed')
    })
}
