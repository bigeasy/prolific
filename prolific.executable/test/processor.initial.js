exports.triage = function () {
    const assert = require('assert')
    const LEVEL = require('prolific.level')
    let count = 0
    return function (level) {
        assert(level != null)
        assert(count++ < 3)
        return level <= LEVEL.warn
    }
}

exports.process = async function () {
    let count = 0
    const path = require('path')
    const gather = require(path.join(__dirname, 'gather'))
    const sink = require('prolific.sink')
    return function (entry) {
        if (count++ == 0) {
            throw new Error('thrown')
        }
        gather.push(entry)
    }
}
