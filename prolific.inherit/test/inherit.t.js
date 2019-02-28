require('proof')(1, prove)

function prove (okay) {
    var inherit = require('../inherit'), inheritance

    inheritance = inherit({
        env: { INHERIT_FD: 5 },
        arrayed: { inherit: [ 0, 1, 2, 4, 4, 'INHERIT_FD', 8 ] }
    })
    okay(inheritance, [ 0, 1, 2, 'ignore', 4, 5, 'ignore', 'ignore', 8 ], 'inherit')
}
