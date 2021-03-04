require('proof')(8, async (okay) => {
    const stream = require('stream')
    const { Consolidator } = require('../consolidator')
    const { Duplex } = require('duplicitous')
    {
        const queue = []
        const consolidator = new Consolidator(queue)
        consolidator.synchronous(null)
        okay(queue, [ null ], 'queue')
    }
    {
        const duplex = new Duplex
        const queue = []
        const consolidator = new Consolidator(queue)
        const async = consolidator.asynchronous(duplex)
        duplex.input.write(JSON.stringify({ series: 0 }) + '\n')
        const next = JSON.stringify({ series: 1 }) + '\n'
        duplex.input.write(next.substring(0, 4))
        await new Promise(resolve => setImmediate(resolve))
        duplex.input.write(next.substring(4))
        duplex.input.write(JSON.stringify({ series: 2 }))
        duplex.input.end()
        await async
        await new Promise(resolve => setImmediate(resolve))
        okay(String(duplex.output.read()), ([{
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
        const duplex = new Duplex
        const async = consolidator.asynchronous(duplex)
        duplex.input.write('{\n')
        duplex.input.end()
        await async
    }
    {
        const duplex = new Duplex
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
        const promise = consolidator.asynchronous(duplex)
        duplex.input.write(JSON.stringify({ series: 0 }) + '\n')
        duplex.input.write(JSON.stringify({ series: 2 }) + '\n')
        duplex.input.write(JSON.stringify({ series: 3 }) + '\n')
        duplex.input.end()
        await promise
        await new Promise(resolve => setImmediate(resolve))
        okay(duplex.output.read().toString(), ([{
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
    {
        const duplex = new Duplex
        const queue = []
        const consolidator = new Consolidator(queue, {
            say: (message, context) => {
                okay({
                    message: message
                }, {
                    message: 'consolidator.socket'
                }, 'bad socket')
            }
        })
        const promise = consolidator.asynchronous(duplex)
        await null
        duplex.emit('error', new Error('error'))
        await promise
    }
})
