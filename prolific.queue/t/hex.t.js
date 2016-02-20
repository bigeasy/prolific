require('proof')(2, prove)

function prove (assert) {
    var hex = require('../hex')
    assert('00000000', hex(0, 8), 'padding')
    assert('ffffffff', hex(0xffffffff, 8), 'padding')
}
