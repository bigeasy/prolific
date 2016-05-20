require('proof')(3, prove)

function prove (assert) {
    var Chunk = require('..')
    var chunk = new Chunk(0, '1\n')
    assert(chunk.number, 0, 'number')
    assert(chunk.checksum, '05eb07a2', 'checksum')
    assert(chunk.header('aaaaaaaa').toString(), '0 aaaaaaaa 05eb07a2 2\n', 'header')
}
