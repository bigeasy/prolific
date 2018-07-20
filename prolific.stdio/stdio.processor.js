var cadence = require('cadence')

var stringify = require('prolific.stringify')

function Processor (configuration, next) {
    this._streamName = configuration.stderr ? 'stderr' : 'stdout'
    this._next = next
}

Processor.prototype.process = function (entry) {
    process[this._streamName].write(stringify(entry))
    this._next.process(entry)
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
