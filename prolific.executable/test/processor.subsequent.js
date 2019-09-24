processor.triage = function () {
    const assert = require('assert')
    const LEVEL = require('prolific.level')
    let count = 0
    return function (level) {
        assert(count++ < 2)
        return level <= LEVEL.warn
    }
}

processor.process = async function () {
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
