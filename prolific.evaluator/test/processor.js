exports.triage = async function () {
    const LEVEL = require('prolific.level')
    return function (level) {
        return level == LEVEL.panic
    }
}

exports.process = async function () {
    const path = require('path')
    const other = require('./test/other')
    return function (entries) {
        return { other, __filename, __dirname }
    }
}
