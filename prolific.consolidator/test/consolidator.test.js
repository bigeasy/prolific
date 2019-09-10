describe('consolidator', () => {
    const assert = require('assert')
    const stream = require('stream')
    const Consolidator = require('../consolidator')
    it('can consolidate', async () => {
        const synchronous = new stream.PassThrough
        const asynchronous = new stream.PassThrough
        const queue = []
        const consolidator = new Consolidator(asynchronous, synchronous, queue)
        const async = consolidator.asynchronous()
        const sync = consolidator.synchronous()
        asynchronous.write(JSON.stringify([{ value: 1 }]) + '\n')
        await new Promise(resolve => setImmediate(resolve))
        assert.deepStrictEqual(queue.shift(), [{ value: 1 }], 'async')
            synchronous.write(JSON.stringify({
                method: 'entries',
                series: 1,
                entries: [{ value: 2 }]
            }) + '\n')
        await new Promise(resolve => setImmediate(resolve))
        assert.equal(queue.length, 0, 'earlier in series')
        synchronous.write(JSON.stringify({
            method: 'entries',
            series: 2,
            entries: [{ value: 2 }]
        }) + '\n')
        await new Promise(resolve => setImmediate(resolve))
        assert.deepStrictEqual(queue.shift(), [{ value: 2 }], 'sync')
        consolidator.exit()
        await async
        await sync
    })
    it('can report a stream error', () => {
        const test = []
        const synchronous = new stream.PassThrough
        const asynchronous = new stream.PassThrough
        const queue = []
        const consolidator = new Consolidator(asynchronous, synchronous, queue)
        consolidator.on('error', (error) => test.push(error.stream))
        synchronous.emit('error', new Error('error'))
        assert.deepStrictEqual(test, [ 'synchronous' ], 'test')
    })
})
