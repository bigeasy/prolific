processor.triage = function () {
    require('prolific.level')
    return function (level, qualifier, label) {
        return label == 'acceptible'
    }
}

processor.process = function () {}
