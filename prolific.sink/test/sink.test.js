require('proof')(1, (okay) => {
    const sink = require('..')
    sink.Date = { now: function () { return 0 } }
    sink.properties = { z: 26, when: 0 }
    sink.json('error', 'hello', 'greeting', { a: 1, when: 0 })
    sink.queue = []
    sink.json = function (level, qualifier, label, body) {
        this.queue.push({
            level: level,
            qualifier: qualifier,
            label: label,
            body: body,
            system: this.properties
        })
    }
    sink.json('error', 'hello', 'greeting', { a: 1, when: 0 })
    okay(sink.queue, [{
        level: 'error',
        qualifier: 'hello',
        label: 'greeting',
        body: { a: 1, when: 0 },
        system: { z: 26, when: 0 }
    }], 'json')
})
