exports.triage = function () {
    const assert = require('assert')
    const LEVEL = require('prolific.level')
    let count = 0
    return function (level) {
        assert(count++ < 2)
        return LEVEL[level] <= LEVEL.warn
    }
}

exports.process = async function () {
    const path = require('path')
    const gather = require(path.join(__dirname, 'gather'))
    const sink = require('prolific.sink')
    return function (entry) {
        if (entry != null) {
            entry.body.subsequent = true
            gather.push(entry)
        }
    }
}
