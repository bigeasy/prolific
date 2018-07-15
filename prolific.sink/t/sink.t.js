require('proof')(1, prove)

function prove (okay) {
    var Acceptor = require('prolific.accept')
    var prolific = require('..')
    prolific.Date = { now: function () { return 0 } }
    prolific.properties = { z: 26, when: 0 }
    prolific.json([ '', 'hello' ], 'error', 'hello', 'greeting', { a: 1, when: 0 })
    prolific.acceptor = new Acceptor(false, [])
    prolific.json([ '', 'hello' ], 'error', 'hello', 'greeting', { a: 1, when: 0 })
    okay(prolific.queue, [
         [{
            when: 0,
            pid: process.pid,
            level: 'error',
            label: 'greeting',
            qualifier: 'hello',
            qualified: 'hello#greeting'
        }, {
            z: 26, when: 0
        }, {
            a: 1, when: 0
        }]
    ], 'json')
}
