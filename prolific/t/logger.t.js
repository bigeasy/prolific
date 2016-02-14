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
        _timestamp: function () {
            return '2015-06-27T01:45:30.742Z'
        }
    }

    controller._supersede.set([ '' ], 'info')

    var logger = new Logger('hello.world', controller)
    logger.trace('hello')
    expect({
        context: 'hello.world',
        name: 'hello',
        level: 'info',
        timestamp: '2015-06-27T01:45:30.742Z'
    }, 'info')
    logger.info('hello')
    expect({
        context: 'hello.world',
        name: 'hello',
        level: 'error',
        timestamp: '2015-06-27T01:45:30.742Z',
        key: 'value'
    }, 'error')
    logger.error('hello', { key: 'value' }, 1)

    expect({
        context: 'hello.world',
        name: 'log',
        level: 'info',
        timestamp: '2015-06-27T01:45:30.742Z',
        key: 'value'
    }, 'log')
    var log = logger.log
    log('info', 'log', { key: 'value' })

    logger.debug('hello')

    expect({
        context: 'hello.world',
        name: 'hello',
        level: 'warn',
        timestamp: '2015-06-27T01:45:30.742Z'
    }, 'warn')
    logger.warn('hello')

    expect({
        context: 'hello.world',
        name: 'rescued',
        level: 'error',
        timestamp: '2015-06-27T01:45:30.742Z',
        key: 'value',
        message: 'error',
        stack: '*'
    }, 'rescue')
    logger.rescue('rescued', { key: 'value' })({ message: 'error', stack: '*' })
    logger.rescue('rescued', { key: 'value' })()
}
