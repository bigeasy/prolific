require('proof')(2, prove)

function prove (assert) {
    var createUncaughtExceptionHandler = require('../uncaught')
    createUncaughtExceptionHandler(function (error) {
        assert(error.message, 'function', 'function handler')
    })(new Error('function'))
    var cause = new Error('cause')
    var base = { ignore: true }
    var error = Object.create(base)
    error.stack = true
    error.code = 1
    error.cause = cause
    createUncaughtExceptionHandler({
        error: function (message, properties) {
            properties.stack = !! properties.stack
            properties.cause.stack = !! properties.cause.stack
            assert(properties, {
                stack: true, code: 1, cause: { stack: true }
            }, 'logger handler')
        }
    })(error)
}
