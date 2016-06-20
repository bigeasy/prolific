require('proof')(6, require('cadence')(prove))

function prove (async, assert) {
    var pumper = require('..')
    var Chunk = require('prolific.chunk')
    var events = require ('events')
    var stream = require('stream')
    var stderr = new stream.PassThrough
    async(function () {
        var child = new events.EventEmitter
        var io = {
            async: new stream.PassThrough,
            sync: new stream.PassThrough
        }
        pumper([{
            process: function (entry) {
                assert(entry, { a: 1 }, 'sender')
                return []
            }
        }], child, io, stderr, async())
        io.sync.write(new Buffer('hello, world\n'))
        var chunk = new Chunk(0, new Buffer(''), 1)
        io.async.write(chunk.header('aaaaaaaa'))
        io.async.write(chunk.buffer)
        var previousChecksum = chunk.checksum
        var buffer = new Buffer('{"a":1}\n')
        chunk = new Chunk(1, buffer, buffer.length)
        io.async.write(chunk.header(previousChecksum))
        io.async.write(chunk.buffer)
        previousChecksum = chunk.checksum
        buffer = new Buffer('{"a":1}\n')
        chunk = new Chunk(2, buffer, buffer.length)
        io.async.write(chunk.header(previousChecksum))
        io.async.write(chunk.buffer)
        io.async.emit('end')
        io.sync.emit('end')
        child.emit('exit', 0, null)
    }, function (code, configuration) {
        assert(code, 0, 'exit code')
        assert(stderr.read().toString(), 'hello, world\n', 'stderr')
        var child = new events.EventEmitter
        var io = {
            async: new stream.PassThrough,
            sync: new stream.PassThrough
        }
        pumper(null, child, io, stderr, async())
        child.emit('exit', null, 'SIGTERM')
        io.sync.emit('end')
        var error = new Error
        error.code = 'ECONNRESET'
        io.async.emit('error', error)
    }, function (code, configuration) {
        assert(code, 1, 'error exit code')
        assert(configuration, null, 'no configuration')
    })
}
