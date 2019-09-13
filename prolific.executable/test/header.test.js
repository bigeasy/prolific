describe('header', () => {
    const assert = require('assert')
    const Header = require('../header')
    const stream = require('stream')
    it('can parse a header', async () => {
        const buffer = Buffer.from(JSON.stringify({ a: 1 }) + '\n')
        const through = new stream.PassThrough
        const promise = Header(through)
        through.write(buffer.slice(0, 2))
        await new Promise(resolve => setImmediate(resolve))
        through.write(buffer.slice(2))
        assert.deepStrictEqual(await promise, { a: 1 }, 'parse')
    })
    it('can report a truncated', async () => {
        const buffer = Buffer.from(JSON.stringify({ a: 1 }) + '\n')
        const through = new stream.PassThrough
        const promise = Header(through)
        through.write(buffer.slice(0, 2))
        await new Promise(resolve => setImmediate(resolve))
        through.end()
        assert.equal(await promise, null, 'truncate')
    })
})
