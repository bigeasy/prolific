require('proof/redux')(1, prove)

function prove (assert) {
    var Logger = require('..')
    var slice = [].slice

    var prolific = require('prolific.resolver')
    prolific.sink.json = function () {
        var vargs = slice.call(arguments)
        assert(vargs, [
            [ '', 'hello' ],
            'error',
            'hello',
            'greeting',
            { a: 1 }
        ], 'log')
    }
    var logger = Logger.createLogger('hello')
    logger.concat('error', 'greeting', { a: 1 })

}