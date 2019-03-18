require('proof')(8, prove)

function prove (okay) {
    var Chunk = require('..')
    var chunk = new Chunk(1, 0, Buffer.from(''), 1)
    okay(chunk.id, 1, 'id')
    okay(chunk.number, 0, 'initial number')
    okay(chunk.checksum, '811c9dc5', 'initial checksum')
    okay(chunk.header('aaaaaaaa').toString(), '% 1 0 aaaaaaaa 811c9dc5 1\n', 'initial header')
    var checksum = chunk.checksum
    var buffer = Buffer.from('a\n')
    var chunk = new Chunk(1, 1, buffer, buffer.length)
    okay(chunk.id, 1, 'subsequent id')
    okay(chunk.number, 1, 'subsequent number')
    okay(chunk.checksum, '2524c6d2', 'subsequent checksum')
    okay(chunk.header(checksum).toString(), '% 1 1 811c9dc5 2524c6d2 2\n', 'subsequent header')
}
