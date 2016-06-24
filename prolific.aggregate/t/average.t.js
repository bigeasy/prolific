require('proof')(2, prove)

function prove (assert) {
    var Average = require('../average')
    var average = new Average(60000)
    assert(average.summarize(), { mean: 0, median: 0, min: 0, max: 0 }, 'empty')
    average.sample(1)
    assert(average.summarize(), { mean: 1, median: 1, min: 1, max: 1 }, 'summarize')
}
