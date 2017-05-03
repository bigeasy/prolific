require('proof')(1, prove)

function prove (assert) {
    var stream = require('stream')
    var Asynchronous = require('../asynchronous')
    var Chunk = require('prolific.chunk')

    var chunk, previousChecksum, buffer

    var through = new stream.PassThrough
    var asynchronous = new Asynchronous(through)

    chunk = new Chunk(1, 0, new Buffer(''), 1)
    write(through, chunk, 'aaaaaaaa')

    previousChecksum = chunk.checksum
    buffer = new Buffer('a\n')
    chunk = new Chunk(1, 1, buffer, buffer.length)
    write(through, chunk, previousChecksum)

    assert(asynchronous.chunks.length, 1, 'read chunk')

    function write (writable, chunk, previousChecksum) {
        writable.write(chunk.header(previousChecksum))
        writable.write(chunk.buffer)
    }
}
