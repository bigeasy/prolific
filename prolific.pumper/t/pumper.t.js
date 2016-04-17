require('proof')(6, require('cadence')(prove))

function prove (async, assert) {
    var pumper = require('..')
    assert(pumper, 'require')
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
        pumper(sender, child, io.async, io.sync, io.forward, async())
        var queue = new Queue
        var sink = queue.createSink(io.async)
        async(function () {
            io.sync.write('hello, world!\n', async())
        }, function () {
            sink.open(async())
        }, function () {
            queue.write('{"key":"value"}\n')
            sink.flush(async())
        }, function () {
            queue.write('a\n')
            sink.flush(async())
        }, function () {
            queue.write('b\n')
            queue.exit(io.sync)
            child.emit('exit', null, 'SIGFOO')
            io.sync.end()
            io.async.end()
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
        pumper(sender, child, io.async, io.sync, io.forward, async())
        child.emit('exit', 0)
        io.sync.end()
        io.async.end()
    }, function (code) {
        assert(code, 0, 'code')
    })
}
