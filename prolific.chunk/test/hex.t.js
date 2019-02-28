require('proof')(2, prove)

function prove (okay) {
    var hex = require('../hex')
    okay('00000000', hex(0, 8), 'padding')
    okay('ffffffff', hex(0xffffffff, 8), 'padding')
}
