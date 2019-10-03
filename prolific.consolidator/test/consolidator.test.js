require('proof')(3, async (okay) => {
    const stream = require('stream')
    const Consolidator = require('../consolidator')
    {
        const queue = []
        const consolidator = new Consolidator(queue)
        consolidator.synchronous(null)
        okay(queue, [ null ], 'queue')
    }
    {
        const input = new stream.PassThrough
        const output = new stream.PassThrough
        const queue = []
        const consolidator = new Consolidator(queue)
        const async = consolidator.asynchronous(input, output)
        input.write(JSON.stringify({ series: 0 }) + '\n')
        input.write(JSON.stringify({ series: 1 }) + '\n')
        input.end()
        await async
        await new Promise(resolve => setImmediate(resolve))
        okay(output.read().toString(), ([{
            method: 'receipt',
            series: 0
        }, {
            method: 'receipt',
            series: 1
        }]).map(JSON.stringify).join('\n') + '\n', 'response')
        consolidator.synchronous({ series: 1 })
        consolidator.synchronous({ series: 2 })
        consolidator.synchronous(null)
        okay(queue, [{
            series: 0
        }, {
            series: 1
        }, {
            series: 2
        }, null ], 'queue')
    }
})
