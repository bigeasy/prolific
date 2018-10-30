exports.triage = function () {
    require('fs')
    return function (level, header) {
        return header.label == 'acceptable'
    }
}

exports.failed = function () {
    throw new Error
}
