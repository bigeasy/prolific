describe('shuttle', () => {
    const assert = require('assert')
    const events = require('events')
    const stream = require('stream')
    const Shuttle = require('../shuttle')
    const descendent = require('descendent')
    const sink = require('prolific.sink')
    const path = require('path')
    const fs = require('fs')
    it('can set a pipe', () => {
        const test = []
        const shuttle = new Shuttle
        descendent.process = new events.EventEmitter
        descendent.process.env = {
            PROLIFIC_SUPERVISOR_PROCESS_ID: '1',
            DESCENDENT_PROCESS_PATH: '1'
        }
        descendent.process.pid = 2
        descendent.process.stderr = new stream.PassThrough
        descendent.process.connected = true
        descendent.process.send = message => test.push(message)
        sink.properties.pid = 0
        sink.Date = { now: function () { return 0 } }
        shuttle.start({ exit: false, Date: { now: function () { return 0 } } })
        shuttle.start()

        sink.json('error', 'example', 'message', { key: 'value' }, { pid: 0 })
        assert.deepStrictEqual(descendent.process.stderr.read().toString().split('\n'), [
            '% 2/0 71c17733 aaaaaaaa 1 %',
            '{"method":"announce","body":{"path":[1,2]}}',
            ''
        ], 'stderr start')

        const pipe = new stream.PassThrough
        descendent.emit('prolific:pipe', {}, pipe)
        descendent.emit('prolific:accept', {
            body: {
                source: fs.readFileSync(path.join(__dirname, 'processor.js')),
                file: path.join(__dirname, 'processor.js'),
                version: 1
            }
        })
        sink.json('error', 'example', 'droppable', { key: 'value' }, { pid: 0 })
        sink.json('error', 'example', 'acceptible', { key: 'value' }, { pid: 0 })
        shuttle.close()
        shuttle.close()
        assert.deepStrictEqual(test, [{
            module: 'descendent',
            method: 'route',
            name: 'prolific:shuttle',
            to: [ 1 ],
            path: [ 2 ],
            body: '2/0'
        }], 'test')
    })
    it('will not initialize when not run under prolific', async () => {
        descendent.process = new events.EventEmitter
        descendent.process.env = {}
        const shuttle = new Shuttle
        await shuttle.start()
        assert(shuttle.closed, 'closed')
    })
    it('will propagate an exception', async () => {
        const test = []
        descendent.process = new events.EventEmitter
        descendent.process.env = {
            PROLIFIC_SUPERVISOR_PROCESS_ID: '1',
            DESCENDENT_PROCESS_PATH: '1'
        }
        descendent.process.pid = 2
        descendent.process.stderr = new stream.PassThrough
        descendent.process.connected = true
        descendent.process.send = message => test.push(message)
        const shuttle = new Shuttle
        const start = shuttle.start({
            uncaughtException: error => test.push(error.message),
            Date: { now: () => 0 }
        })
        assert(!shuttle.closed, 'closed')
        try {
            descendent.process.emit('uncaughtException', new Error('uncaught'))
        } catch (error) {
            test.push(error.message)
        }
        assert(shuttle.closed, 'closed')
        assert.deepStrictEqual(test, [{
            module: 'descendent',
            method: 'route',
            name: 'prolific:shuttle',
            to: [ 1 ],
            path: [ 2 ],
            body: '2/0'
        }, 'uncaught', 'uncaught' ], 'test')
        await start
        assert.deepStrictEqual(descendent.process.stderr.read().toString().split('\n'), [
            '% 2/0 71c17733 aaaaaaaa 1 %',
            '{"method":"announce","body":{"path":[1,2]}}',
            '% 2/0 b798da34 71c17733 1 %',
            '{\"method\":\"exit\"}',
            ''
        ], 'stderr')
    })
    it('will respond to an exit', async () => {
        const test = []
        descendent.process = new events.EventEmitter
        descendent.process.env = {
            PROLIFIC_SUPERVISOR_PROCESS_ID: '1',
            DESCENDENT_PROCESS_PATH: '1'
        }
        descendent.process.pid = 2
        descendent.process.stderr = new stream.PassThrough
        descendent.process.connected = true
        descendent.process.send = message => test.push(message)
        const shuttle = new Shuttle
        const start = shuttle.start({ exit: true, Date: { now: () => 0 } })
        assert(!shuttle.closed, 'closed')
        descendent.process.emit('exit')
        assert(shuttle.closed, 'closed')
        assert.deepStrictEqual(test, [{
            module: 'descendent',
            method: 'route',
            name: 'prolific:shuttle',
            to: [ 1 ],
            path: [ 2 ],
            body: '2/0'
        } ], 'test')
        await start
        assert.deepStrictEqual(descendent.process.stderr.read().toString().split('\n'), [
            '% 2/0 71c17733 aaaaaaaa 1 %',
            '{"method":"announce","body":{"path":[1,2]}}',
            '% 2/0 b798da34 71c17733 1 %',
            '{\"method\":\"exit\"}',
            ''
        ], 'stderr')
    })
})
