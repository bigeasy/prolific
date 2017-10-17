require('proof')(1, prove)

function prove (okay) {
    var eval = require('..')
    var f = eval.create('$x', '$.value + $x + INFO')
    var entry = { json: { value: 1 } }

    okay(eval.invoke(f, entry, 3), 5, 'eval')
}
