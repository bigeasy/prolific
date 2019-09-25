exports.triage = function () {
    const LEVEL = require('prolific.level')
    return function (level) {
        return level <= LEVEL.warn
    }
}

exports.process = function () {
    return function (entries) {
        console.log('>', entries)
    }
}
