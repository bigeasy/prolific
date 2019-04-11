require('proof')(5, prove)

function prove (okay) {
    var Logger = require('..')
    var slice = [].slice

    var tests = [ 'concat', 'log', 'named' ]
    var prolific = require('prolific.resolver')
    prolific.sink.json = function () {
        var vargs = slice.call(arguments)
        okay(vargs, [
            'error',
            'hello',
            'greeting',
            { a: 1 },
            { pid: process.pid }
        ], tests.shift())
    }
    var logger = Logger.createLogger('hello')
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
    prolific.sink.json = function () {
        var vargs = slice.call(arguments)
        var expected = expect.shift()
        vargs[3].stack = !! vargs[3].stack
        okay(vargs, expected.vargs, expected.message)
    }
    var error = new Error('ouch')
    error.code = 'EOUCH'
    logger.stackTrace('panic', 'exception', { key: 'value' }, [ 'code', 'missing' ])(error)
    logger.stackTrace('exception')(error)
}
