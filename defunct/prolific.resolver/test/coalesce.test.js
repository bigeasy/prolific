describe('resolver coalesce', () => {
    const assert = require('assert')
    const coalesce = require('../coalesce')
    it('can coalese', () => {
        assert.equal(coalesce(function () { throw Error }, 'x'), 'x', 'coalesce')
    })
})
