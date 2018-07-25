require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Processor = require('..')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/syslog.processor.t')

    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
        }
    }
    async([function () {
        destructible.destroy()
    }], function () {
        destructible.monitor('Processor', Processor, {}, sink, async())
    }, function (defaults) {
        destructible.monitor('Processor', Processor, {
            application: 'a',
            hostname: 'h',
            serializer: 'json',
            Date: { now: function () { return 0 } }
        }, sink, async())
    }, function (processor) {
        processor.process({
            when: 0,
            level: 3,
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
        okay(sink.gathered[0].formatted.shift(),
        '<131>1 1970-01-01T00:00:00.000Z h a 0 - - {"sequence":0,"level":"error","context":"hello.world","name":"greeting","a":1,"b":3}\n', 'format')
    })
}
