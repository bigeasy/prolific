var LEVEL = require('prolific.level')

var Evaluator = require('prolific.evaluator')
var coalesce = require('extant')

function Processor (destructible, configuration, nextProcessor) {
    this._statics= {}
    var statics = coalesce(configuration['static'], {})
    for (var key in statics) {
        this._statics[key] = Evaluator.create(statics[key]).call(null, { json: {} })
    }
    this._dynamics = {}
    var dynamics = coalesce(configuration['dynamic'], {})
    for (var key in dynamics) {
        this._dynamics[key] = Evaluator.create(dynamics[key])
}
    this._nextProcessor = nextProcessor
}

Processor.prototype.process = function (entry) {
    for (var key in this._statics) {
        entry.env[key] = this._statics[key]
    }
    for (var key in this._dynamics) {
        entry.env[key] = this._dynamics[key].call(null, { json: {} })
    }
    this._nextProcessor.process(entry)
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(destructible, configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
