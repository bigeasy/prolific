require('proof')(1, prove)

function prove (okay) {
    var evaluator = require('..')
    var f = evaluator.create('$.value + ALERT')
    var entry = { json: { value: 1 } }
    okay(f(entry), 2, 'eval')
}
