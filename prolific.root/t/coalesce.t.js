require('proof')(1, prove)

function prove (assert) {
    var nullify = require('../coalesce')
    assert(nullify(function () { throw Error }, 'x'), 'x', 'coalesce')
}
