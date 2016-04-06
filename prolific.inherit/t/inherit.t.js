require('proof')(2, prove)

function prove (assert) {
    var inherit = require('../inherit'), stdio

    stdio = inherit({ command: { param: {}, params: { inherit: [ 0, 1, 2, 4, 4, 5 ] } } })
    assert(stdio, [ 0, 1, 'pipe', 'inherit', 4, 5, 'pipe' ], 'inherit')

    stdio = inherit({ command: { param: { ipc: true }, params: { inherit: [ 0, 1, 2, 4, 4, 5 ] } } })
    assert(stdio, [ 0, 1, 'pipe', 'inherit', 4, 5, 'ipc', 'pipe' ], 'inherit with ipc')
}
