require('proof')(2, prove)

function prove (assert) {
    var stringify = require('../stringify')

    assert(stringify({ formatted: 'foo\n' }), 'foo\n', 'formatted')
    assert(stringify({ a: 1 }), '{"a":1}\n', 'json')
}
