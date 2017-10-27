require('proof')(1, prove)

function prove (assert) {
    var Processor = require('../syslog.processor')
    new Processor({})
    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
        }
    }
    var processor = new Processor({
        application: 'a',
        hostname: 'h',
        serializer: 'json',
        Date: { now: function () { return 0 } }
    }, sink)
    processor.open(function () {})
    var entries = processor.process({
        when: 0,
        level: 4,
        json: {
            when: 0,
            pid: 0,
            sequence: 0,
            level: 'error',
            context: 'hello.world',
            name: 'greeting',
            a: 1, b: 3
        },
        formatted: []
    })
    assert(sink.gathered[0].formatted.shift(),
        '<132>1 1970-01-01T00:00:00.000Z h a 0 - - {"sequence":0,"level":"error","context":"hello.world","name":"greeting","a":1,"b":3}\n', 'format')
    processor.close(function () {})
}
