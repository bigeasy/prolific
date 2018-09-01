require('proof')(1, prove)

function prove (assert) {
    var inherit = require('../inherit'), inheritance

    inheritance = inherit({
        ultimate: {},
        env: { INHERIT_FD: 5 },
        arrayed: { inherit: [ 0, 1, 2, 4, 4, 'INHERIT_FD', 8 ] }
    })
    assert(inheritance, [ 0, 1, 2, 'ignore', 4, 5, 'ignore', 'ignore', 8 ], 'inherit')
}
