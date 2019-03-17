var assert = require('assert')

module.exports = function (buffer, offset) {
    while ((buffer[offset] & 0xc0) == 0x80) {
        offset++
        assert(offset != buffer.length, 'cannot find start of character')
    }
    return offset
}
