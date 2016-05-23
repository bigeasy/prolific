require('proof')(7, prove)

function prove (assert) {
    var Chunk = require('prolific.chunk')
    var Collector = require('../collector')

    var collector = new Collector(false)
    collector.scan(new Buffer('x\n'))
    assert(collector.stderr.shift().toString(), 'x\n', 'stdout not header')
    collector.scan(new Buffer('0 00000000 00000000 0\n'))
    assert(collector.stderr.shift().toString(), '0 00000000 00000000 0\n', 'stdout not valid')

    var chunk

    chunk = new Chunk(0, new Buffer(''), 1)
    var header = chunk.header('aaaaaaaa')
    collector.scan(header.slice(0, 4))
    collector.scan(header.slice(4))
    collector.scan(chunk.buffer)

    var previousChecksum = chunk.checksum

    assert(collector.chunkNumber, 1, 'next chunk number')

    chunk = new Chunk(0, new Buffer(''), 2)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    assert(collector.chunkNumber, 1, 'already initialized')

    var buffer = new Buffer('a\n')
    chunk = new Chunk(2, buffer, buffer.length)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    assert(collector.chunkNumber, 1, 'wrong chunk number')

    chunk = new Chunk(1, buffer, buffer.length)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    assert(collector.chunks.shift().buffer.toString(), 'a\n', 'chunk')

    collector.scan(chunk.header('00000000'))

    assert(collector.chunkNumber, 2, 'wrong previous checksum')
}
