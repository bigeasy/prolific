require('proof')(1, prove)

function prove (assert) {
    var exit = require('../exit')
    assert(exit(), 1, 'unknown signal')
}
