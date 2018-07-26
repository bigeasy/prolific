var COUNTERS = {}

function Processor (configuration, nextProcessor) {
    this._nextProcessor = nextProcessor
    this._name = configuration.name
    COUNTERS[this._name] || (COUNTERS[this._name] = 0)
}

Processor.prototype.process = function (entry) {
    entry.json.sequence = COUNTERS[this._name]++
    this._nextProcessor.process(entry)
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
