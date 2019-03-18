require('proof')(8, prove)

function prove (okay) {
    var Chunk = require('..')
    var chunk = new Chunk(1, 1, Buffer.from('\n'))
    okay(chunk.id, 1, 'id')
    okay(chunk.checksum, '811c9dc5', 'initial checksum')
    okay(chunk.count, 1, 'count')
    okay(chunk.header('aaaaaaaa').toString(), '\n% 1 aaaaaaaa 811c9dc5 1\n', 'initial header')
    var checksum = chunk.checksum
    var buffer = Buffer.from('a\n')
    var chunk = new Chunk(1, 1, buffer)
    okay(chunk.id, 1, 'subsequent id')
    okay(chunk.checksum, 'e40c292c', 'subsequent checksum')
    okay(chunk.count, 1, 'subsequent count')
    okay(chunk.header(checksum).toString(), '\n% 1 811c9dc5 e40c292c 1\n', 'subsequent header')
}
