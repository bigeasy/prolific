require('proof')(3, prove)

function prove (assert) {
    var stream = require('stream')
    var Synchronous = require('../synchronous')
    var Chunk = require('prolific.chunk')

    var chunk, previousChecksum, buffer

    var through = new stream.PassThrough
    var forward = new stream.PassThrough
    var synchronous = new Synchronous(through, forward)

    through.write('hello, world\n')

    chunk = new Chunk(0, 0, new Buffer(''), 1)
    write(through, chunk, 'aaaaaaaa')

    previousChecksum = chunk.checksum
    buffer = new Buffer('a\n')
    chunk = new Chunk(0, 1, buffer, buffer.length)
    write(through, chunk, previousChecksum)

    chunk = new Chunk(1, 0, new Buffer(''), 1)
    write(through, chunk, 'aaaaaaaa')

    previousChecksum = chunk.checksum
    buffer = new Buffer('a\n')
    chunk = new Chunk(1, 1, buffer, buffer.length)
    write(through, chunk, previousChecksum)

    assert(forward.read().toString(), 'hello, world\n', 'through')

    var consumer = {
        chunks: [],
        consume: function (chunk) {
            this.chunks.push(chunk)
        }
    }

    synchronous.addConsumer(1, consumer)

    assert(consumer.chunks.length, 1, 'consumer join')

    previousChecksum = chunk.checksum
    buffer = new Buffer('a\n')
    chunk = new Chunk(1, 2, buffer, buffer.length)
    write(through, chunk, previousChecksum)

    assert(consumer.chunks.length, 2, 'consumer consume')

    function write (writable, chunk, previousChecksum) {
        writable.write(chunk.header(previousChecksum))
        writable.write(chunk.buffer)
    }
}
