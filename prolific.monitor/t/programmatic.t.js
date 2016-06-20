require('proof')(2, prove)

function prove (assert) {
    var programmatic = require('../programmatic')
    programmatic({
        abend: function (message) {
            assert(message, 'no program', 'argv empty')
        }
    }, null, [])
    assert(programmatic(null, false, [ 'echo' ]), 'no module found')
}
