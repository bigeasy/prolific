require('proof')(1, prove)

function prove (assert) {
    var nullify = require('../nullify')
    assert(nullify(function () { throw Error }), null, 'nullify')
}
