exports.triage = function () {
    var assert = require('assert')
    var count = 0
    var LEVEL = require('prolific.level')
    return function (level) {
        assert(count++ < 2)
        return level <= LEVEL.warn
    }
}

exports.process = function () {
    var test = require('prolific.test')
    test.sink || (test.sink = [])
    var cadence = require('cadence')
    return cadence(function () {
        return function (entry) {
            test.sink.push(entry)
        }
    })
}
