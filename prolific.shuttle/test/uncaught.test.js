describe('shuttle uncaught', () => {
    const assert = require('assert')
    const createUncaughtExceptionHandler = require('../uncaught')
    it('can handle an uncaught exception via a user function', () => {
        const test = []
        createUncaughtExceptionHandler(function (error) {
            test.push(error.message)
        })(new Error('function'))
        assert.deepStrictEqual(test, [ 'function' ], 'function handler')
    })
    it('can log an uncaught exception', () => {
        const test = []
        createUncaughtExceptionHandler({
            panic: function (message, properties) {
                test.push(message, !! properties.stack)
            }
        })(new Error('handled'))
        assert.deepStrictEqual(test, [ 'uncaught', true ], 'logger handler')
    })
})
