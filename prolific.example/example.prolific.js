exports.triage = function () {
    var LEVEL = require('prolific.level')
    return function (level) { return level >= LEVEL.notice }
}

exports.process = function () {
    return require('cadence')(function (async, destructible) {
        return function (entry) {
            console.log('from prolifc:', entry)
        }
    })
}
