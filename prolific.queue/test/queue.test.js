describe('queue', () => {
    const assert = require('assert')
    const stream = require('stream')
    const path = require('path')
    const fs = require('fs').promises

    const Pipe = require('duplicitous/pipe')

    const Destructible = require('destructible')
    const callback = require('prospective/callback')
    const ascension = require('ascension')

    const rimraf = require('rimraf')

    const Collector = require('prolific.collector')
    const Watcher = require('prolific.watcher')

    const Queue = require('../queue')

    const TMPDIR = path.join(__dirname, 'tmp')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
    }
    process.on('unhandledRejection', error => { throw error })
    async function reset () {
        await callback(callback => rimraf(TMPDIR, callback))
        await fs.mkdir(dir.publish, { recursive: true })
        await fs.mkdir(dir.stage, { recursive: true })
        // For some reason we need to wait a bit for the above directories to
        // actually take effect on OS X, otherwise files from previous run are
        // extant and the first events are reporting a missing file.
        await new Promise(resolve => setTimeout(resolve, 50))
        const destructible = new Destructible(__filename)
        const watcher = new Watcher(destructible, () => 0, path.join(TMPDIR, 'publish'))
        const collector = new Collector
        watcher.on('data', data => collector.data(data))
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
    it('can exit before setting a pipe', async () => {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'exit')
        let  now = 0
        const test = []
        const pipe = new stream.PassThrough
        pipe.once('finish', () => test.push('finish'))
        const queue = new Queue({
            now: () => now++
        }, TMPDIR, [ 1, 2 ], 1)
        queue.exit(0)
        queue.setSocket({ end: () => {}, unref: () => {} })
        queue.exit(0)
        const gathered = await gatherer.promise
        assert.deepStrictEqual(gathered.map(data => data.body.method), [
            'start', 'exit'
        ], 'exit')
        destructible.destroy()
        await destructible.promise
    })
    it('can write and exit before setting a pipe', async () => {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'exit')
        let  now = 0
        const test = []
        const queue = new Queue({
            now: () => now++
        }, TMPDIR, [ 1, 2 ], 1)
        queue.push({ a: 1 })
        queue.exit(0)
        queue.setSocket({ end: () => {}, unref: () => {} })
        const gathered = await gatherer.promise
        assert.deepStrictEqual(gathered.map(data => data.body.method), [
            'start', 'log', 'exit'
        ], 'exit')
        destructible.destroy()
        await destructible.promise
    })
    it('can write after exit and before setting a pipe', async () => {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'log')
        let  now = 0
        const test = []
        const queue = new Queue({
            now: () => now++
        }, TMPDIR, [ 1, 2 ], 1)
        queue.exit(0)
        const socket = new stream.PassThrough
        queue.setSocket({ end: () => {}, unref: () => {} })
        queue.push({ a: 1 })
        const gathered = await gatherer.promise
        assert.deepStrictEqual(gathered.map(data => data.body.method), [
            'start', 'exit', 'log'
        ], 'exit')
        destructible.destroy()
        await destructible.promise
    })
    it('can write through a pipe', async () => {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'exit')
        let  now = 0
        const test = []
        const queue = new Queue({
            now: () => now++
        }, TMPDIR, [ 1, 2 ], 1)
        const pipe = new Pipe
        pipe.client.unref = () => {}
        const promises = queue.setSocket(pipe.client)
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.version(1)
        pipe.server.write(([{ series: 0 }]).map(JSON.stringify).join('\n') + '\n')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.exit(0)
        const gathered = await gatherer.promise
        assert.deepStrictEqual(gathered.map(data => data.body.method), [
            'start', 'exit'
        ], 'exit')
        destructible.destroy()
        await destructible.promise
        await Promise.all(promises)
        const lines = pipe.server
                          .read()
                          .toString()
                          .split('\n')
                          .filter(line => line != '')
                          .map(JSON.parse)
                          .map(entry => entry.method)
        assert.deepStrictEqual(lines, [ 'version' ], 'entries')
    })
    it('can write through a pipe and send queued initial messages', async () => {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'exit')
        let  now = 0
        const test = []
        const queue = new Queue({
            now: () => now++
        }, TMPDIR, [ 1, 2 ], 1)
        const pipe = new Pipe
        pipe.client.unref = () => {}
        queue.push({ a: 1 })
        const promises = queue.setSocket(pipe.client)
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.push({ a: 1 })
        pipe.server.write(([{ series: 0 }, { series: 1 }]).map(JSON.stringify).join('\n') + '\n')
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.exit(0)
        const gathered = await gatherer.promise
        assert.deepStrictEqual(gathered.map(data => data.body.method), [
            'start', 'exit'
        ], 'exit')
        destructible.destroy()
        await destructible.promise
        await Promise.all(promises)
        const lines = pipe.server
                          .read()
                          .toString()
                          .split('\n')
                          .filter(line => line != '')
                          .map(JSON.parse)
                          .map(entry => entry.method)
        assert.deepStrictEqual(lines, [ 'entries', 'entries' ], 'entries')
    })
    it('can resend unverified batches at exit', async () => {
        const { destructible, watcher, collector } = await reset()
        const gatherer = new Gatherer(collector, 'exit')
        let  now = 0
        const test = []
        const queue = new Queue({
            now: () => now++
        }, TMPDIR, [ 1, 2 ], 1)
        const pipe = new Pipe
        pipe.client.unref = () => {}
        const promises = queue.setSocket(pipe.client)
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.push({ a: 1 })
        await new Promise(resolve => setTimeout(resolve, 5))
        queue.exit(0)
        const gathered = await gatherer.promise
        assert.deepStrictEqual(gathered.map(data => data.body.method), [
            'start', 'log', 'exit'
        ], 'exit')
        destructible.destroy()
        await destructible.promise
        await Promise.all(promises)
        const lines = pipe.server
                          .read()
                          .toString()
                          .split('\n')
                          .filter(line => line != '')
                          .map(JSON.parse)
                          .map(entry => entry.method)
        assert.deepStrictEqual(lines, [ 'entries' ], 'entries')
    })
})
