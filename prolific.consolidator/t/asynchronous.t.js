require('proof')(2, prove)

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

    assert(asynchronous.chunks.shift().buffer.toString(), 'a\n', 'read chunk')

    asynchronous.consume({
        pid: chunk.pid,
        number: chunk.number,
        previousChecksum: previousChecksum,
        checksum: chunk.checksum,
        buffer: chunk.buffer,
        value: chunk.value
    })

    previousChecksum = chunk.checksum

    buffer = new Buffer('b\n')
    chunk = new Chunk(1, 2, buffer, buffer.length)
    write(through, chunk, previousChecksum)

    asynchronous.consume({
        pid: chunk.pid,
        number: chunk.number,
        previousChecksum: previousChecksum,
        checksum: chunk.checksum,
        buffer: chunk.buffer,
        value: chunk.value
    })

    asynchronous.exit()

    assert(asynchronous.chunks.shift().buffer.toString(), 'b\n', 'read chunk from sync')

    function write (writable, chunk, previousChecksum) {
        writable.write(chunk.header(previousChecksum))
        writable.write(chunk.buffer)
    }
}
