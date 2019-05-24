const assert = require('assert')

module.exports = function (buffer, offset) {
    while ((buffer[offset] & 0xc0) == 0x80) {
        offset--
        assert(offset != -1)
    }
    return offset
}
