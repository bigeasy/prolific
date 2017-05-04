require('proof')(2, prove)

function prove (assert) {
    var Processor = require('../sprintf.processor')
    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
        }
    }
    var processor = new Processor({
        format: 'string: %s, integer: %d',
        extractors: [ '$.json.string', '$.json.integer * 2' ]
    }, sink)
    processor.open(function () {})
    processor.process({
        json: {
            name: 'greeting',
            string: 's', integer: 3
        },
        formatted: []
    })
    assert(sink.gathered.shift().formatted[0], 'string: s, integer: 6', 'format')
    processor.close(function () {})

    var processor = new Processor({
        format: 'string: %(json.string)s, integer: %(json.integer)d',
        extractors: [],
    }, sink)
    processor.open(function () {})
    processor.process({
        json: {
            name: 'greeting',
            string: 's', integer: 8
        },
        formatted: []
    })
    assert(sink.gathered.shift().formatted[0], 'string: s, integer: 8', 'format object')

    processor.close(function () {})
}
