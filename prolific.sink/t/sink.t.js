require('proof')(1, prove)

function prove (okay) {
    var prolific = require('..')
    prolific.Date = { now: function () { return 0 } }
    prolific.properties = { z: 26, when: 0 }
    prolific.json('error', 'hello', 'greeting', { a: 1, when: 0 })
    prolific.queue = []
    prolific.json = function (level, qualifier, label, body) {
        this.queue.push({
            level: level,
            qualifier: qualifier,
            label: label,
            body: body,
            system: this.properties
        })
    }
    prolific.json('error', 'hello', 'greeting', { a: 1, when: 0 })
    okay(prolific.queue, [{
        level: 'error',
        qualifier: 'hello',
        label: 'greeting',
        body: { a: 1, when: 0 },
        system: { z: 26, when: 0 }
    }], 'json')
}
