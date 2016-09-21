require('proof/redux')(6, require('cadence')(prove))

function prove (async, assert) {
    var monitor = require('..')
    var Chunk = require('prolific.chunk')
    var events = require ('events')
    var stream = require('stream')
    var stderr = new stream.PassThrough
    async(function () {
        var child = new events.EventEmitter
        child.kill = function () {}
        var io = {
            async: new stream.PassThrough,
            sync: new stream.PassThrough
        }
        monitor({
            process: function (entry) {
                assert(entry, {
                    when: 0,
                    formatted: null,
                    qualifier: [ null, 'bigeasy', 'bigeasy.prolific' ],
                    level: 0,
                    json: { when: 0, qualifier: 'bigeasy.prolific', level: 'trace', a: 1 }
                 }, 'sender')
            }
        }, child, io, stderr, async())
        io.sync.write(new Buffer('hello, world\n'))
        var chunk = new Chunk(0, new Buffer(''), 1)
        io.async.write(chunk.header('aaaaaaaa'))
        io.async.write(chunk.buffer)
        var previousChecksum = chunk.checksum
        var buffer = new Buffer('{"when":0,"qualifier":"bigeasy.prolific","level":"trace","a":1}\n')
        chunk = new Chunk(1, buffer, buffer.length)
        io.async.write(chunk.header(previousChecksum))
        io.async.write(chunk.buffer)
        previousChecksum = chunk.checksum
        buffer = new Buffer('{"when":0,"qualifier":"bigeasy.prolific","level":"trace","a":1}\n')
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
        child.kill = function () {}
        var io = {
            async: new stream.PassThrough,
            sync: new stream.PassThrough
        }
        monitor(null, child, io, stderr, async())
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
