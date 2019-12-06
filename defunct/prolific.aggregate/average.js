var Assessment = require('assessment')

function Average (duration) {
    this._window = new Assessment({
        intervals: [ duration ],
        empty: 0
    }).windows.pop()
}

Average.prototype.sample = function (value) {
    this._window.sample(value)
}

Average.prototype.summarize = function () {
    return this._window.summarize()
}

module.exports = Average
