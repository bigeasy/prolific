require('proof')(1, prove)

function prove (assert) {
    var inherit = require('../inherit')
    var stdio = inherit([ 0, 1, 2, 4, 4, 5 ])

    assert(stdio, [ 0, 1, 'pipe', 'inherit', 4, 5, 'pipe' ], 'inherit')
}
