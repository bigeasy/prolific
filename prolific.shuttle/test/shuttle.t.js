require('proof')(4, async (okay) => {
    const fnv = require('hash.fnv')
    const events = require('events')
    const stream = require('stream')
    const { once } = require('eject')
    const { coalesce } = require('extant')
    const Shuttle = require('../shuttle')
    const sink = require('prolific.sink')
    const path = require('path')
    const Watcher = require('prolific.watcher')
    const Collector = require('prolific.collector')
    const Destructible = require('destructible')
    const fs = require('fs').promises
    const TMPDIR = path.join(__dirname, 'tmp')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
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
    async function reset () {
        await coalesce(fs.rm, fs.rmdir).call(fs, TMPDIR, { force: true, recursive: true })
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
    {
        const shuttle = new Shuttle({ env: {} })
        okay(!shuttle.monitored, 'not monitored')
        shuttle.exit(0)
    }
    {
        const { destructible, collector } = await reset()
        const net = require('net')
        const source = await fs.readFile(path.resolve(__dirname, 'processor.js'), 'utf8')
        const received = new stream.PassThrough
        const server = net.createServer(socket => {
            socket.unref()
            socket.pipe(received)
            socket.write(JSON.stringify({
                method: 'triage',
                processor: {
                    version: 1,
                    source,
                    resolved: {
                        filename: path.join(__dirname, 'processor.js'),
                        __filename: path.join(__dirname, 'processor.js')
                    }
                }
            }) + '\n')
        })
        server.listen(path.resolve(TMPDIR, 'socket'))
        await once(server, 'listening').promise
        const gatherer = new Gatherer(collector, 'entries', 2)
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
        await destructible.destroy().promise
        okay(gathered.map(entry => entry.body.method), [
            'start', 'entries', 'version', 'entries'
        ], 'synchronous')
        const asynchronous = received
                                 .read()
                                 .toString()
                                 .split('\n')
                                 .filter(line => line)
                                 .map(JSON.parse)
                                 .map(entry => entry.method)
        okay(asynchronous, [
            'announce', 'entries', 'version', 'entries'
        ], 'asynchronous')
        server.close()
    }
    {
        const { destructible, collector } = await reset()
        const net = require('net')
        const source = await fs.readFile(path.resolve(__dirname, 'processor.js'), 'utf8')
        const server = net.createServer(socket => {
            socket.unref()
        })
        server.listen(path.resolve(TMPDIR, 'socket'))
        await once(server, 'listening').promise
        const gatherer = new Gatherer(collector, 'start')
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
        await destructible.destroy().rejected
        okay(gathered.map(entry => entry.body.method), [
            'start'
        ], 'synchronous')
        server.close()
    }
})
