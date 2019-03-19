require('proof')(7, prove)

function prove (okay) {
    var Chunk = require('..')
    var chunk = new Chunk(true, [ 1, 2 ], Buffer.from(''))
    okay(chunk.id, '1/2', 'id')
    okay(chunk.checksum, 0x811c9dc5, 'initial checksum')
    okay(chunk.control, 'is control')
    okay(chunk.concat(0).toString(), '% 1/2 00000000 811c9dc5 1 %\n\n', 'concat')
    var chunk = new Chunk(false, [ 1, 2 ], Buffer.from(''))
    okay(!chunk.control, 'not control')
    okay(chunk.concat(0).toString(), '% 1/2 00000000 811c9dc5 0 %\n\n', 'concat')
    okay(Chunk.getBodySize(512, [ 1, 2 ]), 483, 'get body size')
}
