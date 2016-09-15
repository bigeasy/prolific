require('proof/redux')(1, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../label/label.processor')
    var processor = new Processor({
        labels: [{ name: 'key', value: '1' }]
    }, {
        process: function (entry) {
            assert(entry, { key: '1' }, 'labeled')
        }
    })
    async(function () {
        processor.open(async())
    }, function () {
        processor.process({})
    }, function () {
        processor.close(async())
    })
}
