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
    var gather = require('prolific.gather')
    gather.queue || (gather.queue = [])
    var cadence = require('cadence')
    return cadence(function () {
        return function (entry) {
            gather.queue.push(entry)
        }
    })
}
