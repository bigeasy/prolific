processor.triage = function (require) {
    const assert = require('assert')
    const LEVEL = require('prolific.level')
    let count = 0
    return function (level) {
        assert(count++ < 2)
        return level <= LEVEL.warn
    }
}

processor.process = async function (require) {
    const path = require('path')
    const gather = require(path.join(__dirname, 'gather'))
    const sink = require('prolific.sink')
    return function (entry) {
        gather.push(entry)
    }
}
