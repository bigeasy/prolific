require('proof')(3, prove)

function prove (assert) {
    var Consolidator = require('..')
    var Chunk = require('prolific.chunk')
    var consolidator = new Consolidator
    consolidator.sync.ondata(new Buffer('hello, world\n'))
    assert(consolidator.stderr.shift().toString(), 'hello, world\n', 'stderr')

    var chunks = [], chunk, previousChecksum, buffer

    chunk = new Chunk(0, new Buffer(''), 1)
    write(consolidator.async.ondata, chunk, 'aaaaaaaa')

    assert(consolidator.async.writer.chunkNumber, 1, 'chunk number')

    previousChecksum = chunk.checksum
    buffer = new Buffer('a\n')
    chunk = new Chunk(1, buffer, buffer.length)
    write(consolidator.async.ondata, chunk, previousChecksum)

    chunk = new Chunk(0, new Buffer(''), 1)
    write(consolidator.sync.ondata, chunk, 'aaaaaaaa')

    previousChecksum = chunk.checksum
    buffer = new Buffer('a\n')
    chunk = new Chunk(1, buffer, buffer.length)
    write(consolidator.sync.ondata, chunk, previousChecksum)

    previousChecksum = chunk.checksum
    buffer = new Buffer('a\n')
    chunk = new Chunk(2, buffer, buffer.length)
    write(consolidator.sync.ondata, chunk, previousChecksum)

    consolidator.exit()

    assert(consolidator.chunks.length, 2, 'consolidated')

    function write (listener, chunk, previousChecksum) {
        listener(chunk.header(previousChecksum))
        listener(chunk.buffer)
    }
}
