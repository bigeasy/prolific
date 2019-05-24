describe('queue', () => {
    const assert = require('assert')
    const stream = require('stream')
    const Queue = require('../queue')
    it('can exit before setting a pipe', async () => {
        const test = []
        const stderr = new stream.PassThrough
        const pipe = new stream.PassThrough
        pipe.once('finish', () => test.push('finish'))
        const queue = new Queue(512, [ 1, 2 ], stderr, 1, 0)
        const send = queue.send()
        queue.exit()
        queue.exit()
        queue.setPipe(pipe)
        await send
        assert.deepStrictEqual(stderr.read().toString().split('\n'), [
            '% 1/2 224e8640 aaaaaaaa 1 %',
            '{"method":"announce","body":1}',
            '% 1/2 b798da34 224e8640 1 %',
            '{"method":"exit"}',
            ''
        ], 'stderr')
        assert.deepStrictEqual(test, [ 'finish' ], 'pipe closed')
        queue.push(1) // this is no a no-op because we exited
    })
    it('can write through the pipe set after pushing', async () => {
        const test = []
        const stderr = new stream.PassThrough
        const pipe = new stream.PassThrough
        pipe.once('finish', () => test.push('finish'))
        const queue = new Queue(512, [ 1, 2 ], stderr, 1, 25)
        const send = queue.send()
        queue.push(1)
        queue.setPipe(pipe)
        await new Promise(resolve => setImmediate(resolve))
        queue.push(2)
        queue.push(3)
        queue.push(4)
        await new Promise(resolve => setTimeout(resolve, 30))
        queue.close()
        queue.exit()
        await send
        assert.equal(pipe.read().toString(), '[1,2]\n[3,4]\n', 'pipe')
        assert.deepStrictEqual(stderr.read().toString().split('\n'), [
            '% 1/2 224e8640 aaaaaaaa 1 %',
            '{"method":"announce","body":1}',
            '% 1/2 b798da34 224e8640 1 %',
            '{"method":"exit"}',
            ''
        ], 'stderr')
        await new Promise(resolve => setImmediate(resolve))
        assert.deepStrictEqual(test, [ 'finish' ], 'pipe closed')
    })
    it('can write through the pipe set before pushing', async () => {
        const test = []
        const stderr = new stream.PassThrough
        const pipe = new stream.PassThrough
        pipe.once('finish', () => test.push('finish'))
        const queue = new Queue(512, [ 1, 2 ], stderr, 1, 25)
        const send = queue.send()
        queue.setPipe(pipe)
        queue.push(1)
        await new Promise(resolve => setImmediate(resolve))
        queue.close()
        queue.exit()
        await send
        assert.equal(pipe.read().toString(), '[1]\n', 'pipe')
        assert.deepStrictEqual(stderr.read().toString().split('\n'), [
            '% 1/2 224e8640 aaaaaaaa 1 %',
            '{"method":"announce","body":1}',
            '% 1/2 b798da34 224e8640 1 %',
            '{"method":"exit"}',
            ''
        ], 'stderr')
        await new Promise(resolve => setImmediate(resolve))
        assert.deepStrictEqual(test, [ 'finish' ], 'pipe closed')
    })
    it('can write entries through stderr', async () => {
        const test = []
        const stderr = new stream.PassThrough
        const pipe = new stream.PassThrough
        pipe.once('finish', () => test.push('finish'))
        const queue = new Queue(512, [ 1, 2 ], stderr, 1, 25)
        const send = queue.send()
        queue.setPipe(pipe)
        queue.close()
        queue.push(1)
        await new Promise(resolve => setImmediate(resolve))
        queue.close()
        queue.exit()
        await send
        assert.equal(pipe.read(), null, 'pipe')
        assert.deepStrictEqual(stderr.read().toString().split('\n'), [
            '% 1/2 224e8640 aaaaaaaa 1 %',
            '{"method":"announce","body":1}',
            '% 1/2 d8c5403a 224e8640 1 %',
            '{"method":"entries","series":"1","checksum":1981202788,"chunks":1}',
            '% 1/2 7616c164 d8c5403a 0 %',
            '[1]',
            '% 1/2 b798da34 7616c164 1 %',
            '{"method":"exit"}',
            ''
        ], 'stderr')
        await new Promise(resolve => setImmediate(resolve))
        assert.deepStrictEqual(test, [ 'finish' ], 'pipe closed')
    })
})
return
require('proof')(5, require('cadence')(prove))

function prove (async, okay) {
    var abend = require('abend')
    var stream = require('stream')
    var Queue = require('../queue')
    var Chunk = require('prolific.chunk')
    var queue
    var count = 0
    var expected = [
        '[1]\n',
        '[2,3]\n',
        '[4]\n'
    ]
    var writable = {
        write: function (buffer, callback) {
            okay(buffer.toString(), expected.shift(), 'chunk ' + (++count))
            this.wait = callback
        },
        end: function () {
        }
    }
    async(function () {
        // Step through closing before you've set the pipe.
        var pipe = new stream.PassThrough
        queue = new Queue(512, [ 1, 2 ], pipe, 1)
        queue.send(async())
        queue.exit()
        queue.exit()
        queue.setPipe(writable)
    }, function () {
        queue = new Queue(512, [ 1, 2 ], new stream.PassThrough, 1)
        queue.send(async())
        queue.push(1)
        queue.setPipe(writable)
        queue.push(2)
        queue.push(3)
        while (writable.wait != null) {
            var wait = [writable.wait, writable.wait = null][0]
            wait()
        }
        queue.push(4)
        while (writable.wait != null) {
            var wait = [writable.wait, writable.wait = null][0]
            wait()
        }
        queue.close()
        queue.close()
    }, function () {
        var stderr = new stream.PassThrough
        queue = new Queue(100, [ 1, 2 ], stderr, 1)
        queue.setPipe(new stream.PassThrough)
        queue.send(async())
        queue.close()
        queue.push({ alphabet: new Array(3).fill('abcdefghijklmnopqrstuvwxyz') })
        queue.exit()
        queue.push(2)
        var chunk = stderr.read().toString()
        okay(chunk.split('\n'), [
            '% 1/2 224e8640 aaaaaaaa 1 %',
            '{"method":"announce","body":1}',
             '% 1/2 a8d518e8 224e8640 1 %',
            '{"method":"entries","series":1,"checksum":3417670023,"chunks":2}',
            '% 1/2 a6a72ac5 a8d518e8 0 %',
            '[{"alphabet":["abcdefghijklmnopqrstuvwxyz","abcdefghijklmnopqrstuvwxyz"',
            '% 1/2 c1e07487 a6a72ac5 0 %',
            ',"abcdefghijklmnopqrstuvwxyz"]}]',
            '% 1/2 b798da34 c1e07487 1 %',
            '{"method":"exit"}',
            ''
        ], 'exit')
    })
}
