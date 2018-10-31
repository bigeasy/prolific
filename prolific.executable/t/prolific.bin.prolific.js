exports.triage = function () {
    var LEVEL = require('prolific.level')
    return function (level) {
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
