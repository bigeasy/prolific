require('proof')(7, async (okay) => {
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
        const next = JSON.stringify({ series: 1 }) + '\n'
        input.write(next.substring(0, 4))
        await new Promise(resolve => setImmediate(resolve))
        input.write(next.substring(4))
        input.write(JSON.stringify({ series: 2 }))
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
    {
        const queue = []
        const consolidator = new Consolidator(queue, {
            say: (message, context) => {
                okay({
                    message: message,
                    context: context
                }, {
                    message: 'consolidator.json',
                    context: { line: '{' }
                }, 'bad json')
            }
        })
        const input = new stream.PassThrough
        const output = new stream.PassThrough
        const async = consolidator.asynchronous(input, output)
        input.write('{\n')
        input.end()
        await async
    }
    {
        const input = new stream.PassThrough
        const output = new stream.PassThrough
        const queue = []
        const consolidator = new Consolidator(queue, {
            say: (message, context) => {
                okay({
                    message: message,
                    context: context
                }, {
                    message: 'consolidator.series',
                    context: {
                        expected: 1,
                        actual: 2
                    }
                }, 'bad series')
            }
        })
        const async = consolidator.asynchronous(input, output)
        input.write(JSON.stringify({ series: 0 }) + '\n')
        input.write(JSON.stringify({ series: 2 }) + '\n')
        input.write(JSON.stringify({ series: 3 }) + '\n')
        input.end()
        await async
        await new Promise(resolve => setImmediate(resolve))
        okay(output.read().toString(), ([{
            method: 'receipt',
            series: 0
        }, {
            method: 'receipt',
            series: 2
        }, {
            method: 'receipt',
            series: 3
        }]).map(JSON.stringify).join('\n') + '\n', 'response')
        consolidator.synchronous({ series: 1 })
        consolidator.synchronous({ series: 2 })
        consolidator.synchronous(null)
        okay(queue, [{
            series: 0
        }, {
            series: 2
        }, {
            series: 3
        }, null ], 'queue')
    }
})
