var coalesce = require('./coalesce')
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var util = require('util')

var prolific = require('prolific.main')

var main = coalesce(function () {
    return require.main.require('prolific.main')
}, { filename: null })

assert(main.filename == null || main === prolific,
    util.format(fs.readFileSync(path.join(__dirname, 'error.txt'), 'utf8'),
        prolific.filename, main.filename))

module.exports = prolific
