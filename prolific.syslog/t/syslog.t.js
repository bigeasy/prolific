require('proof')(1, prove)

function prove (assert) {
    var required = require('..')
    assert(!! required, 'require')
}
