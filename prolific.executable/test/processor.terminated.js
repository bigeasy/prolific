exports.triage = function () {
    const assert = require('assert')
    const LEVEL = require('prolific.level')
    let count = 0
    return function (level) {
        assert(level != null)
        return LEVEL[level] <= LEVEL.warn
    }
}

exports.process = async function (destructible) {
    let count = 0
    const path = require('path')
    const gather = require(path.join(__dirname, 'gather'))
    const sink = require('prolific.sink')
    destructible.destroy()
    return function (entries) {
        gather.push.apply(gather, entries)
    }
}
