processor.triage = function (require) {
    require('fs')
    return function (level) {
        return level == 0
    }
}

processor.process = async function (require) {
    return function () {
    }
}
