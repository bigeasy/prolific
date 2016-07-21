require('proof')(5, prove)

function prove (assert) {
    var programmatic = require('../programmatic')
    programmatic({
        abend: function (message) {
            assert(message, 'no program', 'argv empty')
        }
    }, null, [])
    assert(programmatic(null, false, [ 'echo' ]), 'no module found')
    assert(!programmatic(null, false, [ 'test' ]), 'test found')
    var argv = [ 'test://127.0.0.1' ]
    assert(!programmatic(null, false, argv), 'test url found')
    assert(argv, [ 'test', '--url', 'test://127.0.0.1' ], 'url expanded')
}
