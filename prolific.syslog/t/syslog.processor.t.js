require('proof')(1, prove)

function prove (assert) {
    var Processor = require('../syslog.processor')
    new Processor({ params: {} })
    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
        }
    }
    var processor = new Processor({
        params: {
            application: 'a',
            host: 'h',
            pid: 0,
            serializer: 'json'
        },
        Date: { now: function () { return 0 } }
    }, sink)
    processor.open(function () {})
    var entries = processor.process({
        sequence: 0,
        level: 'error',
        context: 'hello.world',
        name: 'greeting',
        common: { a: 1, b: 2 },
        specific: { b: 3 }
    })
    assert(sink.gathered[0].formatted,
        '<132>1 1970-01-01T00:00:00.000Z h a 0 - - {"sequence":0,"level":"error","context":"hello.world","name":"greeting","a":1,"b":3}\n', 'format')
    processor.close(function () {})
}
