const LEVEL = require('prolific.level')

processor.triage = function () {
    return function (level) {
        return level == LEVEL.panic
    }
}

processor.process = async function () {
    const path = require('path')
    const other = require('./other')
    return function (entries) {
        return other
    }
}
