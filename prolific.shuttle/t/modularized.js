exports.triage = function () {
    return function (level, qualifier, label) {
        return label == 'acceptible'
    }
}
