processor.triage = function (require) {
    require('fs')
    return function (level) {
        return level == 0
    }
}

processor.process = async function (require) {
    const path = require('path')
    require(path.join(__dirname, 'other.js'))
    return function () {
    }
}
