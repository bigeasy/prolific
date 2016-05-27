var nullify = require('./nullify')
var assert = require('assert')
var fs = require('fs')
var path = require('path')

var prolific = require('prolific.main')

var main = nullify(function () {
    return require.main.require('prolific.main')
})
assert(main == null || main === prolific, fs.readFileSync(path.join(__dirname, 'error.txt'), 'utf8'))

module.exports = prolific
