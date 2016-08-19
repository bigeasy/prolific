var coalesce = require('./coalesce')
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var util = require('util')

var sink = require('prolific.main')

var shuttle = {
    main: coalesce(function () {
        return require.main.require('prolific.shuttle')
    }, { filename: null }),
    mine: coalesce(function () {
        return require('prolific.shuttle')
    }, { filename: null })
}

assert(shuttle.main.filename == shuttle.mine.filename,
    util.format(fs.readFileSync(path.join(__dirname, 'error.txt'), 'utf8'),
        shuttle.mine.filename, shuttle.main.filename))

exports.sink = coalesce(shuttle.mine.sink, sink)
