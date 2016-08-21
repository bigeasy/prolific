require('proof/redux')(1, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../aggregate.processor')
    var processor = new Processor({
        in: 'prolific.example#foo',
        out: 'prolific.example#foo',
        missing: 0,
        aggregations: [{
            name: 'sum',
            value: 'messages=$.messages'
        }, {
            name: 'count',
            value: 'messages'
        }]
    })
    assert(processor, 'required')
    async(function () {
        processor.open(async())
    }, function () {
        processor.process({
            qualified: 'prolific.example#foo',
            messages: 3
        })
        processor.process({
            qualified: 'prolific.example#foo',
            messages: 'steve'
        })
        processor.process({
            qualified: 'prolific.example#bar'
        })
        processor.interval()
    }, function () {
        processor.close(async())
    })
}
