require('proof')(3, prove)

function prove (assert) {
    var Sum = require('../sum')
    var sum = new Sum()
    assert(sum.summarize(), 0, 'constructed')
    sum.sample(78)
    sum.sample(22)
    assert(sum.summarize(), 100, 'summarize')
    assert(sum.summarize(), 0, 'reset')
}
