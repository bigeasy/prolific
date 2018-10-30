exports.triage = function () {
    return function (level, header) {
        return header.label == 'acceptible'
    }
}
