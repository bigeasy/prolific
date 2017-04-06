require('proof')(6, prove)

function prove (assert) {
    var Chunk = require('..')
    var chunk = new Chunk(0, new Buffer(''), 1)
    assert(chunk.number, 0, 'initial number')
    assert(chunk.checksum, '811c9dc5', 'initial checksum')
    assert(chunk.header('aaaaaaaa').toString(), '% 0 aaaaaaaa 811c9dc5 1\n', 'initial header')
    var checksum = chunk.checksum
    var buffer = Buffer('a\n')
    var chunk = new Chunk(1, buffer, buffer.length)
    assert(chunk.number, 1, 'subsequent number')
    assert(chunk.checksum, '2524c6d2', 'subsequent checksum')
    assert(chunk.header(checksum).toString(), '% 1 811c9dc5 2524c6d2 2\n', 'subsequent header')
}
