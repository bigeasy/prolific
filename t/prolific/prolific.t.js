require('proof')(8, prove)

function prove (assert) {
    var prolific = require('../..')
    assert(prolific._timestamp(), 'timestamp')
    prolific.sink = {
        write: function (line) {
            assert(line, '{"a":1}\n', 'write')
        }
    }
    prolific._write({ a: 1 })
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
