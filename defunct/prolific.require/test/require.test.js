describe('require', () => {
    const assert = require('assert')
    it('can require', () => {
        assert((require('..').require)('fs'), 'required')
    })
})
