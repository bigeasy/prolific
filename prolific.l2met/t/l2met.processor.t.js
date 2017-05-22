require('proof')(1, prove)

function prove (assert) {
    var Processor = require('../l2met.processor')
    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
        }
    }
    var processor = new Processor({}, sink)
    processor.open(function () {})
    processor.process({
        json: { name: 'count', l2met: 'count', value: 1, tags: { key: 'value' } },
        formatted: []
    })
    assert(sink.gathered.shift().formatted[0], 'c#count=1 tags=key:value\n', 'format')
    processor.close(function () {})
}
