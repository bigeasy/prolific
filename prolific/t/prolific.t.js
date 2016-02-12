require('proof')(8, prove)

function prove (assert) {
    var prolific = require('..')
    prolific._Date = { now: function () { return 0 } }
    assert(prolific._timestamp(), 'timestamp')
    prolific.syslog({ pid: 4, host: 'prettyrobots.com', application: 'prolific'  })
    prolific.sink = {
        write: function (line) {
            assert(line, '<132>1 1970-01-01T00:00:00.000Z prettyrobots.com prolific 4 - - a=1;\n', 'write')
        }
    }
    prolific._write('error', { a: 1 })
    prolific.setLevel('hello.world', 'trace')
    assert(prolific._supersede.get([ '', 'hello' ]), 'info', 'get default')
    assert(prolific._supersede.get([ '', 'hello', 'world' ]), 'trace', 'get')
    prolific.setLevel('debug')
    assert(prolific._supersede.get([ '', 'hello' ]), 'debug', 'set default')
    prolific.clearLevel('hello.world')
    assert(prolific._supersede.get([ '', 'hello', 'world' ]), 'debug', 'clear')
    prolific.clearLevel()
    assert(prolific._supersede.get([ '', 'hello', 'world' ]), 'info', 'clear default')

    assert(prolific.createLogger('hello.world'), 'create logger')
}
