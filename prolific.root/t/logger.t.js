require('proof')(5, prove)

function prove (assert) {
    var Supersede = require('supersede')
    var Logger = require('../logger')

    var expected = null, message = null
    function expect (_exepcted, _message) {
        expected = _exepcted
        message = _message
    }

    var controller = {
        _supersede: new Supersede,
        _write: function (level, actual) {
            assert(actual, expected, message)
        },
        _Date: {
            now: function () { return 0 }
        }
    }

    controller._supersede.set([ '' ], 'info')

    var logger = new Logger('hello.world', controller)
    logger.trace('hello')
    expect({
        context: 'hello.world',
        name: 'hello',
        level: 'info',
        when: 0
    }, 'info')
    logger.info('hello')
    expect({
        context: 'hello.world',
        name: 'hello',
        level: 'error',
        when: 0,
        key: 'value'
    }, 'error')
    logger.error('hello', { key: 'value' }, 1)

    expect({
        context: 'hello.world',
        name: 'log',
        level: 'info',
        when: 0,
        key: 'value'
    }, 'log')
    var log = logger.log
    log('info', 'log', { key: 'value' })

    logger.debug('hello')

    expect({
        context: 'hello.world',
        name: 'hello',
        level: 'warn',
        when: 0
    }, 'warn')
    logger.warn('hello')

    expect({
        context: 'hello.world',
        name: 'rescued',
        level: 'error',
        when: 0,
        key: 'value',
        message: 'error',
        stack: '*'
    }, 'rescue')
    logger.rescue('rescued', { key: 'value' })({ message: 'error', stack: '*' })
    logger.rescue('rescued', { key: 'value' })()
}
