describe('facility', () => {
    const assert = require('assert')
    const LEVEL = require('..')
    it('can provide facility flags', () => {
        assert.equal(LEVEL.kern, 0, 'panic')
    })
})
