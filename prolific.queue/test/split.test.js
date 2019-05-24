describe('queue split', () => {
    const assert = require('assert')
    const split = require('../split')
    it('can split ASCII', () => {
        assert.equal(split(Buffer.from('abc'), 1), 1, 'ascii')
    })
    it('can split multi-char Unicode', () => {
        assert.equal(split(Buffer.from('a😀'), 3), 1, 'emoji')
    })
})
