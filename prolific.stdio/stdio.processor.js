function Processor (configuration) {
    this._streamName = configuration.params.stderr ? 'stderr' : 'stdout'
}

Processor.prototype.open  = function (callback) { callback () }

Processor.prototype.process = function (entry) {
    process[this._streamName].write(entry.formatted || JSON.stringify(entry) + '\n')
    return [ entry ]
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
