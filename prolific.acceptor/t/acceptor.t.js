require('proof')(16, prove)

// Limited language that is ment to match specific entries in addition to
// winnowing by package and level. Select first by package name, then winnow by
// level or specifically by values in payload. Equality is coercive. Relative
// comparisons convert to numbers.
function prove (okay) {
    var Acceptor = require('..'), acceptor
    try {
    acceptor = new Acceptor(false, [{
        path: '.',
        test: [{ path: 'id', test: [{}] }]
    }])
    } catch (e) {
        okay(e.message, 'invalid test', 'invalid test')
    }
    acceptor = new Acceptor(false, [])
    okay(!acceptor.accept([{ qualifier: 'example' }]), 'default drop')
    acceptor = new Acceptor(true, [])
    okay(acceptor.accept([{ qualifier: 'example' }]), 'default accept')
    acceptor = new Acceptor(false, [{
        path: '.',
        level: 'warn',
        accept: true
    }, {
        path: '.example.timer',
        level: 'debug',
        accept: true
    }, {
        path: '.example.equals',
        test: [{ path: 'tag', equals: 'send' }],
        accept: true
    }, {
        path: '.example.regex',
        test: [{ path: 'tag', regex: '/a/' }],
        accept: true
    }, {
        path: '.example.and',
        test: [{ path: 'id', regex: '/a/' }, { path: 'tag', equals: 'send' }],
        accept: true
    }])
    okay(acceptor.accept([{ qualifier: 'anything', level: 'err' }]), 'level')
    okay(!acceptor.accept([{ qualifier: 'anything', level: 'info' }]), 'level fail')
    okay(!acceptor.accept([{ qualifier: 'example.equals'}]), 'equals missing')
    okay(!acceptor.accept([{ qualifier: 'example.equals', tag: 'receive' }]), 'equals unequal')
    okay(!acceptor.accept([{ qualifier: 'example.equals', tag: [ 'receive' ] }]), 'equals not in array')
    okay(acceptor.accept([{ qualifier: 'example.equals', tag: 'send' }]), 'equals equal')
    okay(acceptor.accept([{ qualifier: 'example.equals', tag: [ 'send' ] }]), 'equals in array')
    okay(!acceptor.accept([{ qualifier: 'example.regex' }]), 'regex missing')
    okay(!acceptor.accept([{ qualifier: 'example.regex', tag: 'b' }]), 'regex fail')
    okay(!acceptor.accept([{ qualifier: 'example.regex', tag: [ 'b' ] }]), 'regex array fail')
    okay(acceptor.accept([{ qualifier: 'example.regex', tag: 'baz' }]), 'regex match')
    okay(acceptor.accept([{ qualifier: 'example.regex', tag: [ 'zzz', 'baz' ] }]), 'regex match array')
    okay(acceptor.accept([{ qualifier: 'example.and', id: 'a', tag: [ 'user', 'send' ] }]), 'and')
}
