var fnv = require('hash.fnv')
var hex = require('./hex')

function Chunk (id, number, buffer, value) {
    this.id = id
    this.number = number
    this.checksum = hex(fnv(0, buffer, 0, buffer.length), 8)
    this.value = value
    this.buffer = buffer
}

Chunk.prototype.header = function (previousChecksum, length) {
    return Buffer.from([
        '% ',
        this.id, ' ',
        this.number, ' ',
        previousChecksum, ' ',
        this.checksum, ' ',
        this.value, '\n'
    ].join(''))
}

module.exports = Chunk
