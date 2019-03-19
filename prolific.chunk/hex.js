var assert = require('assert')

module.exports = function (number, padding) {
    assert(0 <= number && number <= 0xffffffff, 'number out of range')
    var hex = number.toString(16)
    while (hex.length < 8) {
        hex = '0' + hex
    }
    return hex
}
