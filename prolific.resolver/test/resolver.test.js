describe('resolver', () => {
    const assert = require('assert')
    it('can resolve the sink', () => {
        assert(!! require('..').sink, 'required')
    })
})
