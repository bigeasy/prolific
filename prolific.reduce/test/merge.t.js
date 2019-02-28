require('proof')(1, prove)

function prove (okay) {
    var merge = require('../merge')
    okay(merge({
        a: {},
        b: { a: 1 },
        c: [ 'a' ]
    }, {
        a: 1,
        b: { a: 0, b: 0 },
        c: [ 'b', 'c' ],
        d: 0,
    }, { d: true }), {
        a: {},
        b: { a: 1, b: 0 },
        c: [ 'a', 'b', 'c' ]
    }, 'okay')
}
