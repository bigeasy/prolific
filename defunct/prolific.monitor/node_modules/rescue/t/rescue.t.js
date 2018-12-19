require('proof/redux')(5, prove)

function prove (assert) {
    var rescue = require('..')

    rescue(/^foo$/, function (error) {
        assert(error.message, 'foo', 'caught message')
    })(new Error('foo'))

    var f = rescue(/^code:EACCES$/, /^code:ENOENT$/, function (error) {
        assert(error.code, 'ENOENT', 'caught property')
    })
    var error = new Error
    error.code = 'ENOENT'
    f(error)

    try {
        rescue(/^foo$/, function (error) {
        })(new Error('bar'))
    } catch (e) {
        assert(e.message, 'bar', 'uncaught')
    }

    rescue([/^foo$/, function (error) {
        assert(error.message, 'foo', 'flatten array')
    }])(new Error('foo'))

    rescue(/^foo$/)(new Error('foo'))

    assert(rescue(/^foo$/, 1)(new Error('foo')), 1, 'return value')
}
