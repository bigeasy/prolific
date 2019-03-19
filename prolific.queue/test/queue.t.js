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
        okay(pipe.read().toString().split('\n'), [
            '% 1/2 224e8640 aaaaaaaa 1 %',
            '{"method":"announce","body":1}',
            '% 1/2 b798da34 224e8640 1 %',
            '{"method":"exit"}',
            ''
        ], 'exit early')
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
