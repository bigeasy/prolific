processor.triage = function () {
    return function (level, qualifier, label) {
        return label == 'acceptible'
    }
}

processor.process = function () {}
