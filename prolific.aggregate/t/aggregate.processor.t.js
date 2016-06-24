require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../aggregate.processor')
    new Processor({ params: {}, ordered: [] })
    var processor = new Processor({
        params: {
            in: 'prolific.example#foo',
            out: 'prolific.example#foo',
            missing: 0
        },
        ordered: [{
            name: 'in',
            value: 'prolific.example#foo'
        }, {
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
