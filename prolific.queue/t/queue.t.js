require('proof/redux')(6, require('cadence')(prove))

function prove (async, assert) {
    var stream = require('stream')
    var Queue = require('../queue')
    var Chunk = require('prolific.chunk')
    var queue
    var count = 0
    var expected = [
        '% 0 aaaaaaaa 811c9dc5 1\n',
        '',
        '% 1 811c9dc5 fdaf7437 6\n',
        '1\n2\n3\n',
        '% 0 aaaaaaaa 811c9dc5 1\n',
        ''
    ]
    var writable = {
        write: function (buffer, callback) {
            assert(buffer.toString(), expected.shift(), 'chunk ' + (++count))
            this.wait = callback
        }
    }
    async(function () {
        queue = new Queue(writable)
        queue.write(new Buffer(1 + '\n'))
        queue.write(new Buffer(2 + '\n'))
        queue.write(new Buffer(3 + '\n'))
    }, function () {
        while (writable.wait != null) {
            var wait = [writable.wait, writable.wait = null][0]
            wait()
        }
        queue.exit(null)
        queue.exit(null)
    }, function () {
        queue = new Queue(writable)
        queue.write(new Buffer(1 + '\n'))
        var stderr = new stream.PassThrough
        queue.exit(stderr, function () {})
        var chunk = stderr.read().toString()
        assert(chunk, '% 0 aaaaaaaa 811c9dc5 0\n% 0 811c9dc5 811c9dc5 1\n% 1 811c9dc5 05eb07a2 2\n1\n', 'exit')
        while (writable.wait != null) {
            var wait = [writable.wait, writable.wait = null][0]
            wait()
        }
    })
}
