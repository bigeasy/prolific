var stringify = require('prolific/stringify')

function Processor (configuration, next) {
    this._streamName = configuration.params.stderr ? 'stderr' : 'stdout'
    this._next = next
}

Processor.prototype.open  = function (callback) { callback () }

Processor.prototype.process = function (entry) {
    process[this._streamName].write(stringify(entry))
    this._next.process(entry)
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
