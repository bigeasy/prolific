require('proof')(2, prove)

function prove (assert) {
    var inherit = require('../inherit'), inheritance

    inheritance = inherit({ command: { param: {}, params: { inherit: [ 0, 1, 2, 4, 4, 5, 8 ] } } })
    assert(inheritance, {
        stdio: [ 0, 1, 'pipe', 'ignore', 4, 5, 'ignore', 'ignore', 8, 'pipe' ],
        fd: 9
    }, 'inherit')

    inheritance = inherit({
        command: { param: { ipc: true },
        params: { inherit: [ 0, 1, 2, 4, 4, 5 ] } }
    })
    assert(inheritance, {
        stdio: [ 0, 1, 'pipe', 'ignore', 4, 5, 'ipc', 'pipe' ],
        fd: 7
    }, 'inherit with ipc')
}
