require('proof')(3, prove)

function prove (assert) {
    var Logger = require('..')
    var slice = [].slice

    var tests = [ 'concat', 'log', 'named' ]
    var prolific = require('prolific.resolver')
    prolific.sink.json = function () {
        var vargs = slice.call(arguments)
        assert(vargs, [
            [ '', 'hello' ],
            'error',
            'hello',
            'greeting',
            { a: 1 }
        ], tests.shift())
    }
    var logger = Logger.createLogger('hello')
    logger.concat('error', 'greeting', {}, { a: 1 })
    logger.log('error', 'greeting', { a: 1 })
    logger.error('greeting', { a: 1 })
}
