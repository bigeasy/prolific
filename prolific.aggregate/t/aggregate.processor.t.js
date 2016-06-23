require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../aggregate.processor')
    var processor = new Processor({
        params: {
            in: 'prolific.example#foo',
            out: 'prolific.example#foo',
            missing: 0
        },
        ordered: []
    })
    assert(processor, 'required')
}
