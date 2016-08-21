require('proof/redux')(7, prove)

function prove (assert) {
    var programmatic = require('../programmatic')
    assert(programmatic(true, [ 'echo' ]), null, 'terminal')
    assert(programmatic(false, [ 'echo' ]), null, 'no prolific module found')
    assert(programmatic(false, [ 'test' ]), 'test found')
    var argv = [ 'test://127.0.0.1' ]
    assert(programmatic(false, argv), 'test url found')
    assert(argv, [ '--url', 'test://127.0.0.1' ], 'url expanded')
    assert(programmatic(false, [ '@prolific.test' ]), 'as module')
    assert(programmatic(false, [ '@.' ]), null, 'not command')
}
