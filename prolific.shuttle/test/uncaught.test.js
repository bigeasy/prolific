describe('shuttle uncaught', () => {
    const assert = require('assert')
    const uncaught = require('../uncaught')
    it('can rethrow an uncaught exception', () => {
        try {
            require('../uncaught')('uncaught')(new Error('thrown'))
            throw new Error
        } catch (error) {
            assert.equal(error.message, 'thrown', 'rethrown')
        }
    })
})
