exports.triage = function () {
    var LEVEL = require('prolific.level')
    return function (level) {
        return level <= LEVEL.warn
    }
}

exports.process = function () {
    var gather = require('prolific.gather')
    gather.sink || (gather.sink = [])
    var cadence = require('cadence')
    return cadence(function () {
        return function (entry) {
            gather.sink.push(entry)
        }
    })
}
