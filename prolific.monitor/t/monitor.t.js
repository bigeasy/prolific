require('proof')(6, require('cadence')(prove))

function prove (async, assert) {
    var monitor = require('..')
    assert(monitor, 'require')
    var stream = require('stream')
    var events = require('events')
    var Queue = require('prolific.queue')
    var sent = [ 'a\n', 'b\n' ]
    var sender = {
        send: function (buffer) {
            assert(buffer.toString(), sent.shift(), 'sent')
        }
    }
    var io = {
        async: new stream.PassThrough,
        sync: new stream.PassThrough,
        forward: new stream.PassThrough
    }
    async(function () {
        var child = new events.EventEmitter
        monitor(sender, child, io.async, io.sync, io.forward, async())
        var queue = new Queue
        var sink = queue.createSink(io.async)
        async(function () {
            io.sync.write('hello, world!\n', async())
        }, function () {
            sink.open(async())
        }, function () {
            queue.write('a\n')
            sink.flush(async())
        }, function () {
            queue.write('b\n')
            queue.exit(io.sync)
            child.emit('close', null, 'SIGFOO')
        })
    }, function (code) {
        assert(io.forward.read().toString(), 'hello, world!\n', 'forward')
        assert(code, 1, 'signaled')
    }, function () {
        var child = new events.EventEmitter
        var io = {
            async: new stream.PassThrough,
            sync: new stream.PassThrough,
            forward: new stream.PassThrough
        }
        monitor(sender, child, io.async, io.sync, io.forward, async())
        child.emit('close', 0)
    }, function (code) {
        assert(code, 0, 'code')
    })
}
