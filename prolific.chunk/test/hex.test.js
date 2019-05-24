describe('chunk hex', () => {
    const assert = require('assert')
    const hex = require('../hex')
    describe('it can format hex', () => {
        assert.equal('ffffffff', hex(0xffffffff, 8), 'padding')
    })
    describe('it can pad zeros', () => {
        assert.equal('00000000', hex(0, 8), 'padding')
    })
})
