require('proof')(1, prove)

function prove (assert) {
    var coalesce = require('../coalesce')
    assert(coalesce(function () { throw Error }, 'x'), 'x', 'coalesce')
}
