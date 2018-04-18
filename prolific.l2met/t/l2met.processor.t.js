require('proof')(2, prove)

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
        json: { label: 'count', l2met: 'count', value: 1, tags: { key: 'value' } },
        formatted: []
    })
    processor.process({
        json: { label: 'count', l2met: 'count', value: 1 },
        formatted: []
    })
    processor.process({
        json: { l2met: 'steve' },
        formatted: []
    })
    assert(sink.gathered.shift().formatted[0], 'c#count=1 tags=key:value\n', 'format')
    assert(sink.gathered.shift().formatted[0], 'c#count=1\n', 'format to tags')
    processor.close(function () {})
}
