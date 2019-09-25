exports.triage = function () {
    require('prolific.level')
    return function (level, qualifier, label) {
        return label == 'acceptible'
    }
}

exports.process = function () {}
