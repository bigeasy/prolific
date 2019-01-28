require('proof')(2, prove)

function prove (assert) {
    var stringify = require('..')

    assert(stringify({ formatted: [ 'foo\n' ] }), 'foo\n', 'formatted')
    assert(stringify({ formatted: [], json: { a: 1 } }), '{"a":1}\n', 'json')
}
