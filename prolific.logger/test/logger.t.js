require('proof')(1, (okay) => {
    const Logger = require('..')
    const test = []
    Logger.sink.json = function (...vargs) {
        test.push(vargs)
    }
    const logger = Logger.create('hello')
    logger.concat('error', 'greeting', {}, { a: 1 })
    logger.log('error', 'greeting', { a: 1 })
    logger.error('greeting', { a: 1 })
    const expect = [{
        vargs: [
            'panic',
            'hello',
            'exception',
            { code: 'EOUCH', key: 'value', stack: false },
            { pid: process.pid }
        ],
        message: 'level, context, properties'
    }, {
        vargs: [
            'error',
            'hello',
            'exception',
            { stack: true, code: 'EOUCH' },
            { pid: process.pid }
        ],
        message: 'no level nor context nor properties'
    }]
    Logger.sink.json = function (...vargs) {
        test.push(vargs)
    }
    const error = new Error('ouch')
    error.code = 'EOUCH'
    logger.stackTrace('panic', 'exception', { key: 'value' }, [ 'code', 'missing' ])(error)
    logger.stackTrace('exception')(error)
    test[test.length - 1][3].stack = !! test[test.length - 1][3].stack
    okay(test, [[
        'error', 'hello', 'greeting', { a: 1 }, { pid: process.pid }
    ], [
        'error', 'hello', 'greeting', { a: 1 }, { pid: process.pid }
    ], [
        'error', 'hello', 'greeting', { a: 1 }, { pid: process.pid }
    ], [
        'panic', 'hello', 'exception', { code: 'EOUCH', key: 'value' }, { pid: process.pid }
    ], [
        'error', 'hello', 'exception', { code: 'EOUCH', stack: true }, { pid: process.pid }
    ]], 'test')
})
