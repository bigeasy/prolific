require('proof')(5, prove)

function prove (okay) {
    var Properties = require('../properties')
    var properties = new Properties([ { a: 1 }, { a: 2 }, {} ])
    okay(properties.get('b'), undefined, 'missing')
    okay(properties.get('a'), 2, 'get')
    properties.set('a', 3)
    okay(properties.get('a'), 3, 'set')
    okay(properties.remove('a'), 3, 'remove')
    okay(properties.get('a'), undefined, 'gone')
}
