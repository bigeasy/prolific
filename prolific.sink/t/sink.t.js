require('proof')(1, prove)

function prove (okay) {
    var Acceptor = require('prolific.acceptor')
    var prolific = require('..')
    prolific.Date = { now: function () { return 0 } }
    prolific.properties = { z: 26, when: 0 }
    prolific.json([ '', 'hello' ], 'error', 'hello', 'greeting', { a: 1, when: 0 })
    prolific.queue = []
    prolific.acceptor = new Acceptor(true, [])
    prolific.json([ '', 'hello' ], 'error', 'hello', 'greeting', { a: 1, when: 0 })
    okay(prolific.queue, [{
        level: 3,
        formatted: [],
        env: {},
        json: {
            when: 0,
            pid: process.pid,
            level: 'error',
            label: 'greeting',
            qualifier: 'hello',
            qualified: 'hello#greeting',
            z: 26,
            a: 1
        }
    }], 'json')
}
