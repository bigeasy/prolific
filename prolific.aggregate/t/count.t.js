require('proof/redux')(3, prove)

function prove (assert) {
    var Count = require('../count')
    var count = new Count()
    assert(count.summarize(), 0, 'constructed')
    count.sample(78)
    assert(count.summarize(), 1, 'summarize')
    assert(count.summarize(), 0, 'reset')
}
