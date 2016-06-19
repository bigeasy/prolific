require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../tee.processor')
    var processor = new Processor({
        configuration: {
            processors: [{
                moduleName: 'prolific.test/test.processor',
                parameters: { params: { key: 'value' } },
                argv: [],
                terminal: false
            }]
        }
    })
    async(function () {
        processor.open(async())
    }, function () {
        processor.process({ a: 1 })
    }, function () {
        processor.close(async())
    }, function () {
        assert(processor._processors[0]._gathered, [{ a: 1 }], 'processed')
    })
}
