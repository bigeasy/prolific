require('proof')(14, async (okay) => {
    const path = require('path')
    const fs = require('fs').promises
    const fnv = require('hash.fnv')

    const Pipe = require('duplicitous/pipe')

    const Destructible = require('destructible')
    const callback = require('prospective/callback')

    const rimraf = require('rimraf')

    const Collector = require('prolific.collector')
    const Watcher = require('prolific.watcher')

    const Queue = require('../queue')

    const once = require('prospective/once')

    const TMPDIR = path.join(__dirname, 'tmp')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
    }
    async function reset () {
        await callback(callback => rimraf(TMPDIR, callback))
        await fs.mkdir(dir.publish, { recursive: true })
        await fs.mkdir(dir.stage, { recursive: true })
        // For some reason we need to wait a bit for the above directories to
        // actually take effect on OS X, otherwise files from previous run are
        // extant and the first events are reporting a missing file.
        await new Promise(resolve => setTimeout(resolve, 50))
        const destructible = new Destructible(__filename)
        const watcher = new Watcher(destructible, buffer => {
            return fnv(0, buffer, 0, buffer.length)
        }, path.join(TMPDIR, 'publish'))
        const collector = new Collector
        watcher.on('data', data => collector.data(data))
        watcher.on('data', data => data)
        return { destructible, watcher, collector }
    }
    class Gatherer {
        constructor (collector, method, count = 1) {
            this._method = method
            this._count = count
            this.promise = new Promise(resolve => {
                let count = 0
                const gathered = []
                collector.on('data', data => {
                    gathered.push(data)
                    if (data.body.method == this._method && ++count == this._count) {
                        resolve(gathered)
                    }
                })
            })
        }
    }
    class Net {
        constructor () {
            this.pipe = new Pipe
            this.pipe.client.unref = () => {}
        }

        connect (path) {
            return this.pipe.client
        }
    }
    {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'start')
        let  now = 0
        const test = []
        const queue = new Queue({ now: () => now++ }, TMPDIR, 2, 1)
        queue.exit(0)
        const net = new Net
        queue.connect(net, './socket')
        queue.exit(0)
        net.pipe.client.emit('connect')
        await new Promise(resolve => setImmediate(resolve))
        const gathered = await gatherer.promise
        okay(gathered.map(data => data.body.method), [
            'start'
        ], 'exit')
        await destructible.destroy().rejected
    }
    {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'entries')
        let  now = 0
        const test = []
        const queue = new Queue({ now: () => now++ }, TMPDIR, 2, 1)
        queue.push({ a: 1 })
        queue.exit(0)
        const net = new Net
        queue.connect(net, './socket')
        const gathered = await gatherer.promise
        okay(gathered.map(data => data.body.method), [
            'start', 'entries'
        ], 'exit')
        await destructible.destroy().rejected
    }
    {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'entries')
        let  now = 0
        const test = []
        const queue = new Queue({ now: () => now++ }, TMPDIR, 2, 1)
        queue.exit(0)
        const net = new Net
        queue.connect(net, './socket')
        queue.push({ a: 1 })
        const gathered = await gatherer.promise
        okay(gathered.map(data => data.body.method), [
            'start', 'entries'
        ], 'exit')
        await destructible.destroy().destructed
    }
    {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'start')
        let  now = 0
        const test = []
        const queue = new Queue({ now: () => now++ }, TMPDIR, 2, 1)
        const net = new Net
        const promises = queue.connect(net, './socket')
        net.pipe.client.emit('connect')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.version(1)
        net.pipe.server.write(([{
            method: 'triage',
            processor: {
                version: 1,
                source: '1 + 1',
                resolved: {
                    __filename: '/opt/src/processor.js',
                    filename: '/opt/var/processor.js',
                }
            }
        }]).map(JSON.stringify).join('\n') + '\n')
        await new Promise(resolve => setImmediate(resolve))
        net.pipe.server.write(([{ method: 'receipt', series: 0 }]).map(JSON.stringify).join('\n') + '\n')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.exit(0)
        const gathered = await gatherer.promise
        okay(gathered.map(data => data.body.method), [ 'start' ], 'exit')
        await destructible.destroy().destructed
        await Promise.all(await promises)
        const lines = net.pipe.server
                              .read()
                              .toString()
                              .split('\n')
                              .filter(line => line != '')
                              .map(JSON.parse)
                              .map(entry => entry.method)
        okay(lines, [ 'announce', 'version' ], 'version')
    }
    {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'start')
        let  now = 0
        const test = []
        const queue = new Queue({ now: () => now++ }, TMPDIR, 2, 1)
        const triage = once(queue, 'triage').promise
        queue.push({ a: 1 })
        const net = new Net
        const promises = queue.connect(net, './socket')
        net.pipe.client.emit('connect')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.push({ a: 1 })
        net.pipe.server.write(([{
            method: 'triage',
            processor: {
                version: 1,
                source: '1 + 1',
                resolved: {
                    __filename: '/opt/src/processor.js',
                    filename: '/opt/var/processor.js',
                }
            }
        }]).map(JSON.stringify).join('\n') + '\n')
        await new Promise(resolve => setImmediate(resolve))
        net.pipe.server.write(([{
            method: 'receipt', series: 0
        }]).map(JSON.stringify).join('\n') + '\n')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.exit(0)
        const gathered = await gatherer.promise
        okay(gathered.map(data => data.body.method), [ 'start' ], 'exit')
        await destructible.destroy().destructed
        await Promise.all(await promises)
        const lines = net.pipe.server
                              .read()
                              .toString()
                              .split('\n')
                              .filter(line => line != '')
                              .map(JSON.parse)
                              .map(entry => entry.method)
        okay(lines, [ 'announce', 'entries' ], 'entries')
        okay((await triage)[0], {
            version: 1,
            source: '1 + 1',
            resolved: {
                __filename: '/opt/src/processor.js',
                filename: '/opt/var/processor.js',
            }
        }, 'triage')
    }
    {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'entries')
        let  now = 0
        const test = []
        const queue = new Queue({ now: () => now++ }, TMPDIR, 2, 1)
        const net = new Net
        const promises = queue.connect(net, './socket')
        net.pipe.client.emit('connect')
        net.pipe.server.write(JSON.stringify({
            method: 'triage', source: '1 + 1', file: '/opt/processor.js', version: 1
        }) + '\n')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.push({ a: 1 })
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.exit(0)
        const gathered = await gatherer.promise
        okay(gathered.map(data => data.body.method), [
            'start', 'entries'
        ], 'exit')
        await destructible.destroy().destructed
        await Promise.all(await promises)
        const lines = net.pipe.server
                              .read()
                                .toString()
                               .split('\n')
                               .filter(line => line != '')
                               .map(JSON.parse)
                               .map(entry => entry.method)
        okay(lines, [ 'announce', 'entries' ], 'entries')
    }
    {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'version')
        let  now = 0
        const test = []
        const queue = new Queue({ now: () => now++ }, TMPDIR, 2, 1)
        const net = new Net
        const promises = queue.connect(net, './socket')
        net.pipe.client.emit('connect')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.version(1)
        net.pipe.server.write(([{
            method: 'triage', source: '1 + 1', file: '/opt/processor.js', version: 1
        }]).map(JSON.stringify).join('\n') + '\n')
        await new Promise(resolve => setImmediate(resolve))
        net.pipe.server.write('[')
        net.pipe.server.end()
        await new Promise(resolve => setTimeout(resolve, 50))
        queue.exit(0)
        const gathered = await gatherer.promise
        okay(gathered.map(data => data.body.method), [
            'start', 'version'
        ], 'exit')
        await destructible.destroy().destructed
        await Promise.all(await promises)
        const lines = net.pipe.server
                              .read()
                              .toString()
                              .split('\n')
                              .filter(line => line != '')
                              .map(JSON.parse)
                              .map(entry => entry.method)
        okay(lines, [ 'announce', 'version' ], 'version')
    }
    {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'version')
        let  now = 0
        const test = []
        const queue = new Queue({ now: () => now++ }, TMPDIR, 2, 1)
        const net = new Net
        const promises = queue.connect(net, './socket')
        net.pipe.client.emit('connect')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.version(1)
        net.pipe.server.end()
        await new Promise(resolve => setTimeout(resolve, 50))
        queue.exit(0)
        const gathered = await gatherer.promise
        okay(gathered.map(data => data.body.method), [
            'start', 'version'
        ], 'exit')
        await destructible.destroy().destructed
        await Promise.all(await promises)
        const lines = net.pipe.server
                              .read()
                              .toString()
                              .split('\n')
                              .filter(line => line != '')
                              .map(JSON.parse)
                              .map(entry => entry.method)
        okay(lines, [ 'announce' ], 'version')
    }
})
