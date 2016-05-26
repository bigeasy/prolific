require('proof')(1, prove)

function prove (assert) {
    var prolific = require('..')
    assert(prolific.sink, 'required')
}
