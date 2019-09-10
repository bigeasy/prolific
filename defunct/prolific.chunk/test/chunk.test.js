describe('chunk', () => {
    const assert = require('assert')
    const Chunk = require('..')
    it('can create a control chunk', () => {
        const chunk = new Chunk(true, [ 1, 2 ], Buffer.from(''))
        assert.equal(chunk.id, '1/2', 'id')
        assert.equal(chunk.checksum, 0x811c9dc5, 'initial checksum')
        assert(chunk.control, 'is control')
        assert.equal(chunk.concat(0).toString(), '% 1/2 811c9dc5 00000000 1 %\n\n', 'concat')
    })
    it('can create a payload chunk', () => {
        const chunk = new Chunk(false, [ 1, 2 ], Buffer.from(''))
        assert(!chunk.control, 'not control')
        assert.equal(chunk.concat(0).toString(), '% 1/2 811c9dc5 00000000 0 %\n\n', 'concat')
        assert.deepStrictEqual(Chunk.getBodySize(512, [ 1, 2 ]), 483, 'get body size')
    })
})
