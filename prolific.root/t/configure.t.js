require('proof')(2, prove)

function prove (assert) {
    var configure = require('../configure')
    assert(configure({ env: '{"processors":[],"levels":[]}' }, 'inherit'), {
        processors: [],
        levels: []
    }, 'inherit')
    assert(configure(null, '{}'), {
        processors: [],
        levels: []
    }, 'json')
}
