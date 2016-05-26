require('proof')(1, prove)

function prove (assert) {
    var Logger = require('../logger')
    var slice = [].slice

    var prolific = require('prolific')
    prolific.json = function () {
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
    logger.error('greeting', { a: 1 })
}
