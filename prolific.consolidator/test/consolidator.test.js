describe('consolidator', () => {
    const assert = require('assert')
    const stream = require('stream')
    const Consolidator = require('../consolidator')
    it('can consolidate', async () => {
        const input = new stream.PassThrough
        const output = new stream.PassThrough
        const queue = []
        const consolidator = new Consolidator(input, output, queue)
        const async = consolidator.asynchronous()
        input.write(JSON.stringify({ series: 0 }) + '\n')
        input.write(JSON.stringify({ series: 1 }) + '\n')
        await new Promise(resolve => setImmediate(resolve))
        assert.equal(output.read().toString(), '{"series":0}\n{"series":1}\n', 'response')
        consolidator.synchronous({ series: 1 })
        consolidator.synchronous({ series: 2 })
        consolidator.eos()
        consolidator.eos()
        assert.deepStrictEqual(queue, [{
            series: 0
        }, {
            series: 1
        }, {
            series: 2
        }, {
            method: 'eos'
        }], 'queue')
    })
})
