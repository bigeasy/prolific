describe('levels', () => {
    const assert = require('assert')
    const LEVEL = require('..')
    it('can provide logging levels', () => {
        assert.equal(LEVEL.panic, 0, 'panic')
    })
})
