require('proof')(1, prove)

function prove (okay) {
    var evaluator = require('..')
    var f = evaluator.create('$x', '$.value + $x + INFO')
    var entry = { json: { value: 1 } }
    okay(f(entry, 3), 5, 'eval')
}
