require('proof')(2, prove)

function prove (okay) {
    var split = require('../split')
    var buffer = Buffer.from('abc')
    okay(split(Buffer.from('abc'), 1), 1, 'ascii')
    okay(split(Buffer.from('a😀'), 3), 1, 'emoji')
}
