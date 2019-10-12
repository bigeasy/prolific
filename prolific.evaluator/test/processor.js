exports.triage = async function () {
    return function (level) {
        return level == 'panic'
    }
}

exports.process = async function () {
    const path = require('path')
    const other = require('./test/other')
    return function (entries) {
        return { other, __filename, __dirname }
    }
}
