require('proof')(2, prove)

function prove (assert) {
    var inherit = require('../inherit'), inheritance

    inheritance = inherit({
        ultimate: {},
        env: { INHERIT_FD: 5 },
        arrayed: { inherit: [ 0, 1, 2, 4, 4, 'INHERIT_FD', 8 ] }
    })
    assert(inheritance, [ 0, 1, 'pipe', 'ignore', 4, 5, 'ignore', 'ignore', 8 ], 'inherit')

    inheritance = inherit({
        ultimate: { ipc: true },
        arrayed: { inherit: [ 0, 1, 2, 4, 4, 5 ] }
    })
    assert(inheritance, [ 0, 1, 'pipe', 'ignore', 4, 5, 'ipc' ], 'inherit with ipc')
}
