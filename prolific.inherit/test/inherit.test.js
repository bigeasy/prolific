describe('inherit', () => {
    const assert = require('assert')
    const inherit = require('../inherit')
    it('can create a stdio definition', () => {
        const inheritance = inherit({
            env: { INHERIT_FD: 5 },
            arrayed: { inherit: [ 0, 1, 2, 4, 4, 'INHERIT_FD', 8 ] }
        })
        assert.deepStrictEqual(inheritance, [ 0, 1, 2, 'ignore', 4, 5, 'ignore', 'ignore', 8 ], 'inherit')
    })
})
