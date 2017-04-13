require('proof')(7, prove)

function prove (assert) {
    var commandable = require('../commandable')
    assert(commandable(true, [ 'echo' ]), null, 'terminal')
    assert(commandable(false, [ 'echo' ]), null, 'no prolific module found')
    assert(commandable(false, [ 'test' ]), 'test found')
    var argv = [ 'test://127.0.0.1' ]
    assert(commandable(false, argv), 'test url found')
    assert(argv, [ '--url', 'test://127.0.0.1' ], 'url expanded')
    assert(commandable(false, [ '@prolific.test' ]), 'as module')
    assert(commandable(false, [ '@./' ]), null, 'not command')
}
