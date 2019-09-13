processor.triage = function (require) {
    const LEVEL = require('prolific.level')
    return function (level) {
        return level <= LEVEL.warn
    }
}

processor.process = function () {
    return function (entries) {
        console.log('PROCESSING >', entries)
    }
}
