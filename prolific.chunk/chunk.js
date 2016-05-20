var fnv = require('hash.fnv')
var hex = require('./hex')

function Chunk (number, string) {
    this.number = number
    this.buffer = new Buffer(string)
    this.checksum = hex(fnv(0, this.buffer, 0, this.buffer.length), 8)
}

Chunk.prototype.header = function (previousChecksum) {
    return new Buffer([
        this.number, ' ',
        previousChecksum, ' ',
        this.checksum, ' ',
        this.buffer.length, '\n'
    ].join(''))
}

module.exports = Chunk
