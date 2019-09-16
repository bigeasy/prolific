describe('shuttle', () => {
    const assert = require('assert')
    const fnv = require('hash.fnv')
    const events = require('events')
    const stream = require('stream')
    const once = require('prospective/once')
    const Shuttle = require('../shuttle')
    const callback = require('prospective/callback')
    const rimraf = require('rimraf')
    const sink = require('prolific.sink')
    const path = require('path')
    const Watcher = require('prolific.watcher')
    const Pipe = require('duplicitous/pipe')
    const Collector = require('prolific.collector')
    const Destructible = require('destructible')
    const fs = require('fs').promises
    const TMPDIR = path.join(__dirname, 'tmp')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
    }
    process.on('unhandledRejection', error => { throw error })
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
        return { destructible, watcher, collector }
    }
    it('will not initialize when not run under prolific', async () => {
        const shuttle = new Shuttle({ env: {} })
        assert(!shuttle.monitored, 'not monitored')
        shuttle.exit(0)
    })
    it('can set a pipe', async () => {
        const { destructible, collector } = await reset()
        const net = require('net')
        const source = await fs.readFile(path.resolve(__dirname, 'processor.js'), 'utf8')
        const received = new stream.PassThrough
        const server = net.createServer(socket => {
            socket.unref()
            socket.pipe(received)
            socket.write(JSON.stringify({
                method: 'triage',
                source,
                file: path.join(__dirname, 'processor.js'),
                version: 1
            }) + '\n')
        })
        server.listen(path.resolve(TMPDIR, 'socket'))
        await once(server, 'listening').promise
        const gatherer = new Gatherer(collector, 'exit')
        const test = []
        sink.properties.pid = 0
        sink.Date = { now: function () { return 0 } }
        const shuttle = new Shuttle({
            Date: { now: function () { return 0 } },
            interval: 1,
            exit: false,
            pid: 2,
            env: {
                PROLIFIC_SUPERVISOR_PROCESS_ID: '1',
                DESCENDENT_PROCESS_PATH: '1',
                PROLIFIC_TMPDIR: path.resolve(__dirname, 'tmp')
            },
            uncaughtException: false,
            unhandledRejection: false
        })
        sink.json('error', 'example', 'message', { key: 'value' }, { pid: 0 })
        await new Promise(resolve => setTimeout(resolve, 100))
        sink.json('error', 'example', 'droppable', { key: 'value' }, { pid: 0 })
        sink.json('error', 'example', 'acceptible', { key: 'value' }, { pid: 0 })
        await new Promise(resolve => setTimeout(resolve, 100))
        shuttle.exit(0)
        const gathered = await gatherer.promise
        destructible.destroy()
        await destructible.promise
        assert.deepStrictEqual(gathered.map(entry => entry.body.method), [
            'start', 'entries', 'version', 'entries', 'exit'
        ], 'synchronous')
        const asynchronous = received
                                 .read()
                                 .toString()
                                 .split('\n')
                                 .filter(line => line)
                                 .map(JSON.parse)
                                 .map(entry => entry.method)
        assert.deepStrictEqual(asynchronous, [
            'announce', 'entries', 'version', 'entries'
        ], 'asynchronous')
        server.close()
    })
    it('will set default handlers', async () => {
        const { destructible, collector } = await reset()
        const net = require('net')
        const source = await fs.readFile(path.resolve(__dirname, 'processor.js'), 'utf8')
        const server = net.createServer(socket => {
            socket.unref()
        })
        server.listen(path.resolve(TMPDIR, 'socket'))
        await once(server, 'listening').promise
        const gatherer = new Gatherer(collector, 'exit')
        const test = []
        sink.properties.pid = 0
        sink.Date = { now: function () { return 0 } }
        const shuttle = new Shuttle({
            Date: { now: function () { return 0 } },
            interval: 1,
            pid: 2,
            env: {
                PROLIFIC_SUPERVISOR_PROCESS_ID: '1',
                DESCENDENT_PROCESS_PATH: '1',
                PROLIFIC_TMPDIR: path.resolve(__dirname, 'tmp')
            }
        })
        shuttle.exit(0)
        const gathered = await gatherer.promise
        destructible.destroy()
        await destructible.promise
        assert.deepStrictEqual(gathered.map(entry => entry.body.method), [
            'start', 'exit'
        ], 'synchronous')
        server.close()
    })
})
