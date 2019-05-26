describe('logger', () => {
    const assert = require('assert')
    const Logger = require('..')
    it('can log', () => {
        const test = []
        const prolific = require('prolific.resolver')
        prolific.sink.json = function (...vargs) {
            test.push(vargs)
        }
        const logger = Logger.createLogger('hello')
        logger.concat('error', 'greeting', {}, { a: 1 })
        logger.log('error', 'greeting', { a: 1 })
        logger.error('greeting', { a: 1 })
        var expect = [{
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
        prolific.sink.json = function (...vargs) {
            test.push(vargs)
        }
        const error = new Error('ouch')
        error.code = 'EOUCH'
        logger.stackTrace('panic', 'exception', { key: 'value' }, [ 'code', 'missing' ])(error)
        logger.stackTrace('exception')(error)
        test[test.length - 1][3].stack = !! test[test.length - 1][3].stack
        assert.deepStrictEqual(test, [[
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
})
