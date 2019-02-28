require('proof')(1, prove)

function prove (okay) {
    var Syslog = require('..')

    var syslog = new Syslog({ application: 'a', hostname: 'h' })
    var formatted = syslog.format({
        when: 0,
        pid: 0,
        sequence: 0,
        level: 'error',
        context: 'hello.world',
        name: 'greeting',
        a: 1, b: 3
    })
    okay(formatted, '<131>1 1970-01-01T00:00:00.000Z h a 0 - - {"sequence":0,"level":"error","context":"hello.world","name":"greeting","a":1,"b":3}\n', 'format')
}
