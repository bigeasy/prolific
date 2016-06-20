require('proof')(2, prove)

function prove (assert) {
    var configure = require('../configure')
    assert(configure({ env: '{"processors":[]}' }, 'inherit'), {
        processors: []
    }, 'inherit')
    assert(configure(null, '{}'), {
        processors: []
    }, 'json')
}
