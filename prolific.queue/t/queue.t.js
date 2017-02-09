require('proof/redux')(5, require('cadence')(prove))

function prove (async, assert) {
    var stream = require('stream')
    var Queue = require('../queue')
    var Chunk = require('prolific.chunk')
    var queue
    var count = 0
    var expected = [
        '% 0 aaaaaaaa 811c9dc5 1\n',
        '% 1 811c9dc5 fdaf7437 6\n1\n2\n3\n',
        '% 0 aaaaaaaa 811c9dc5 1\n'
    ]
    var writable = {
        write: function (buffer, callback) {
            assert(buffer.toString(), expected.shift(), 'chunk ' + (++count))
            this.wait = callback
        },
        end: function () {
        }
    }
    async(function () {
        queue = new Queue(writable, new stream.PassThrough)
        queue.push(1)
        queue.push(2)
        queue.push(3)
    }, function () {
        while (writable.wait != null) {
            var wait = [writable.wait, writable.wait = null][0]
            wait()
        }
        queue.exit()
        queue.exit()
    }, function () {
        var stderr = new stream.PassThrough
        queue = new Queue(writable, stderr)
        queue.push(1)
        queue.exit()
        queue.close()
        var chunk = stderr.read().toString()
        assert(chunk, '% 0 aaaaaaaa 811c9dc5 0\n% 0 811c9dc5 811c9dc5 1\n% 1 811c9dc5 05eb07a2 2\n1\n', 'exit')
        queue.push(1)
        var chunk = stderr.read().toString()
        assert(chunk, '% 2 05eb07a2 05eb07a2 2\n1\n', 'write after exit')
    })
}
