require('proof')(1, prove)

function prove (assert) {
    var hex = require('../hex')
    assert('00000001', hex(1, 8), 'padding')
}
