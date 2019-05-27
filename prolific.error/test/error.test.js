describe('error', () => {
    const assert = require('assert')
    const Prolific = { Error: require('..') }
    it('is an error', () => {
        assert(new Prolific.Error() instanceof Error, 'is error')
    })
})
