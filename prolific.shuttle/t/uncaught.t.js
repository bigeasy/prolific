require('proof')(3, prove)

function prove (assert) {
    var createUncaughtExceptionHandler = require('../uncaught')
    createUncaughtExceptionHandler(function (error) {
        assert(error.message, 'function', 'function handler')
    })(new Error('function'))
    var error = new Error('handled')
    createUncaughtExceptionHandler({
        panic: function (message, properties) {
            assert(message, 'uncaught', 'message')
            assert(properties.stack, error.stack, 'stack')
        }
    })(error)
}
