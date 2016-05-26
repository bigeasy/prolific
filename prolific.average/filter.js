function Filter (configuration) {
    this._averages = configuration.averages.map(function (average) {
        return {
            name: average.name,
            average: new Average(average.configuration)
        }
    })
    this._intervalDuration = configuration.interval
}

Average.prototype.start = function (callback) {
    this._interval = setInterval(this._summarize.bind(this), this._intervalDuration)
    callback()
}

Average.prototype._summarize = function () {
}

Average.prototype.stop = function (callback) {
    clearInterval(this._interval)
    callback()
}
