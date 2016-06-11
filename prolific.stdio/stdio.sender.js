function Sender (configuration) {
    var params = configuration.params
    this._streamName = params.stderr ? 'stderr' : 'stdout'
}

Sender.prototype.open  = function (callback) { callback () }

Sender.prototype.entry = function (entry) {
    process[this._streamName].write(entry.formatted || JSON.stringify(entry) + '\n')
    return [ entry ]
}

Sender.prototype.close = function (callback) { callback() }

module.exports = Sender
