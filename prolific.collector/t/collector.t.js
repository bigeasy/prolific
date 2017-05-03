require('proof')(9, prove)

function prove (assert) {
    var Chunk = require('prolific.chunk')
    var Collector = require('../collector')

    var collector = new Collector(false)
    collector.scan(new Buffer('x\n'))
    assert(collector.stderr.shift().toString(), 'x\n', 'stdout not header')
    collector.scan(new Buffer('0 00000000 00000000 0\n'))
    assert(collector.stderr.shift().toString(), '0 00000000 00000000 0\n', 'stdout not valid')

    var chunk

    chunk = new Chunk(1, 0, new Buffer(''), 1)
    var header = chunk.header('aaaaaaaa')
    collector.scan(header.slice(0, 4))
    collector.scan(header.slice(4))
    collector.scan(chunk.buffer)

    var previousChecksum = chunk.checksum

    assert(collector.chunkNumber[1], 1, 'next chunk number stderr initialization')

    chunk = new Chunk(1, 1, new Buffer('a\n'), 2)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    previousChecksum = chunk.checksum
    console.log(chunk)

    assert(collector.chunkNumber[1], 2, 'next chunk number')

    chunk = new Chunk(1, 0, new Buffer(''), 2)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    assert(collector.chunkNumber[1], 2, 'already initialized')

    var buffer = new Buffer('b\n')
    chunk = new Chunk(1, 1, buffer, buffer.length)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    assert(collector.chunkNumber[1], 2, 'wrong chunk number')

    chunk = new Chunk(1, 2, buffer, buffer.length)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    assert(collector.chunks.shift().buffer.toString(), 'a\n', 'chunk a')
    assert(collector.chunks.shift().buffer.toString(), 'b\n', 'chunk b')

    collector.scan(chunk.header('00000000'))

    assert(collector.chunkNumber[1], 3, 'wrong previous checksum')
}
