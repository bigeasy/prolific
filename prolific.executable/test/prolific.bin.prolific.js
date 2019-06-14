exports.triage = function () {
    var LEVEL = require('prolific.level')
    return function (level) {
        return level <= LEVEL.warn
    }
}

exports.process = async function () {
    const gather = require('prolific.gather')
    gather.sink || (gather.sink = [])
    return function (entry) {
        gather.sink.push(entry)
    }
}
