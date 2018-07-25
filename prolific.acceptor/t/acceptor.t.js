require('proof')(16, prove)

// Limited language that is ment to match specific entries in addition to
// winnowing by package and level. Select first by package name, then winnow by
// level or specifically by values in payload. Equality is coercive. Relative
// comparisons convert to numbers.
function prove (okay) {
    var Acceptor = require('..'), acceptor
    acceptor = new Acceptor(false, [])
    okay(!acceptor.acceptByProperties([{ qualifier: 'example' }]), 'default drop')
    acceptor = new Acceptor(true, [])
    okay(!! acceptor.acceptByProperties([{ qualifier: 'example' }]), 'default accept')
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
        test: '$.tag && $.tag.indexOf &&  ~$.tag.indexOf("send")',
        accept: true
    }, {
        path: '.example.equals',
        test: '$.id == 1',
        accept: true
    }, {
        path: '.example.regex',
        test: '/a/.test($.value)',
        accept: true
    }, {
        path: '.example.and',
        test: '/a/.test($.id) && ~($.tag || []).indexOf("send")',
        accept: true
    }])
    okay(acceptor.acceptByProperties([{ qualifier: 'anything', level: 'err' }]), 'level')
    okay(!acceptor.acceptByProperties([{ qualifier: 'anything', level: 'info' }]), 'level fail')
    okay(!acceptor.acceptByProperties([{ qualifier: 'example.equals'}]), 'equals missing')
    okay(!acceptor.acceptByProperties([{ qualifier: 'example.equals', tag: 'receive' }]), 'equals unequal')
    okay(!acceptor.acceptByProperties([{ qualifier: 'example.equals', tag: [ 'receive' ] }]), 'equals not in array')
    okay(acceptor.acceptByProperties([{
        qualifier: 'example.equals', tag: [ 'send' ], level: 'warn'
    }, {
        key: 'value'
    }]), {
        path: [ '', 'example', 'equals', '' ],
        level: 4,
        qualifier: [ null, 'example', 'example.equals' ],
        formatted: [],
        json: {
            qualifier: 'example.equals',
            tag: [ 'send' ],
            level: 'warn',
            key: 'value'
        }
    }, 'equals equal')
    okay(acceptor.acceptByProperties([{ qualifier: 'example.equals', tag: [ 'send' ] }]), 'equals in array')
    okay(!acceptor.acceptByProperties([{ qualifier: 'example.regex' }]), 'regex missing')
    okay(!acceptor.acceptByProperties([{ qualifier: 'example.regex', tag: 'b' }]), 'regex fail')
    okay(!acceptor.acceptByProperties([{ qualifier: 'example.regex', tag: [ 'b' ] }]), 'regex array fail')
    okay(acceptor.acceptByProperties([{ qualifier: 'example.regex', value: 'baz' }]), 'regex match')
    okay(acceptor.acceptByProperties([{ qualifier: 'example.regex', value: 'baz' }]), 'regex match array')
    okay(acceptor.acceptByProperties([{ qualifier: 'example.and', id: 'a', tag: [ 'user', 'send' ] }]), 'and')
    okay(acceptor.acceptByContext({ path: [ '', 'example', 'equals' ], level: 7, json: { tag: [ 'send' ] } }), 'by context')
}
