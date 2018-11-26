require('proof')(15, prove)

function prove (okay) {
    var Chunk = require('prolific.chunk')
    var Collector = require('../collector')

    var collector = new Collector(false)
    collector.scan(Buffer.from('x\n'))
    okay(collector.stderr.shift().toString(), 'x\n', 'stdout not header')
    collector.scan(Buffer.from('0 00000000 00000000 0\n'))
    okay(collector.stderr.shift().toString(), '0 00000000 00000000 0\n', 'stdout not valid')

    var chunk

    chunk = new Chunk(1, 0, Buffer.from(''), 1)
    var header = chunk.header('aaaaaaaa')
    collector.scan(header.slice(0, 4))
    collector.scan(header.slice(4))
    collector.scan(chunk.buffer)

    okay(collector.chunks.length, 0, 'no chunks after header chunk')

    var previousChecksum = chunk.checksum

    okay(collector.chunkNumber[1], 1, 'next chunk number stderr initialization')

    chunk = new Chunk(1, 1, Buffer.from('a\n'), 2)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    previousChecksum = chunk.checksum

    okay(collector.chunkNumber[1], 2, 'next chunk number')

    chunk = new Chunk(1, 0, Buffer.from(''), 2)
    collector.scan(chunk.header('aaaaaaaa'))
    collector.scan(chunk.buffer)

    okay({
        number: collector.chunkNumber[1],
        stderr: collector.stderr.shift().toString(),
    }, {
        number: 2,
        stderr: '% 1 0 aaaaaaaa 811c9dc5 2\n'
    }, 'already initialized')

    chunk = new Chunk(1, 0, Buffer.from(''), 2)
    collector.scan(chunk.header('00000000'))
    collector.scan(chunk.buffer)

    okay({
        number: collector.chunkNumber[1],
        stderr: collector.stderr.shift().toString(),
    }, {
        number: 2,
        stderr: '% 1 0 00000000 811c9dc5 2\n'
    }, 'initial entry wrong checksum')

    var buffer = Buffer.from('b\n')
    chunk = new Chunk(1, 1, buffer, buffer.length)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    okay({
        number: collector.chunkNumber[1],
        stderr: [
            collector.stderr.shift().toString(),
            collector.stderr.shift().toString()
        ]
    }, {
        number: 2,
        stderr: [ '% 1 1 2524c6d2 a72c4f3d 2\n', 'b\n' ]
    }, 'wrong chunk number')

    chunk = new Chunk(1, 2, buffer, buffer.length)
    collector.scan(chunk.header(previousChecksum))
    collector.scan(chunk.buffer)

    previousChecksum = chunk.checksum

    okay(collector.chunks.shift().buffer.toString(), 'a\n', 'chunk a')
    okay(collector.chunks.shift().buffer.toString(), 'b\n', 'chunk b')

    collector.scan(chunk.header('00000000'))

    okay({
        number: collector.chunkNumber[1],
        stderr: collector.stderr.shift().toString(),
    }, {
        number: 3,
        stderr: '% 1 2 00000000 a72c4f3d 2\n'
    }, 'wrong previous checksum')

    chunk = new Chunk(1, 3, Buffer.from(''), 0)
    chunk.checksum = 'aaaaaaaa'
    collector.scan(Buffer.concat([
        chunk.header(previousChecksum), Buffer.from('hello, world')
    ]))

    okay(collector.chunks.shift().eos, 'end of stream')

    collector.exit()

    okay({
        stderr: collector.stderr.shift().toString(),
    }, {
        stderr: 'hello, world'
    }, 'exit')

    var collector = new Collector(true)

    chunk = new Chunk(1, 0, Buffer.from(''), 1)
    collector.scan(chunk.header('aaaaaaaa'))
    collector.scan(chunk.buffer)

    previousChecksum = chunk.checksum

    okay(collector.chunks.length, 0, 'async header chunk')

    chunk = new Chunk(1, 1, Buffer.from(''), 0)
    chunk.checksum = 'aaaaaaaa'
    collector.scan(chunk.header(previousChecksum))

    okay(collector.chunks.shift().eos, 'async end of stream')
}
