var LEVEL = require('prolific.level')

var Evaluator = require('prolific.evaluator')
var coalesce = require('extant')

function Processor (destructible, configuration, nextProcessor) {
    this._revise = Evaluator.create(configuration.revise)
    this._nextProcessor = nextProcessor
}

Processor.prototype.process = function (entry) {
    this._revise.call(null, entry)

    entry.json.level = coalesce(entry.json.level, 'notice')
    entry.json.qualifier = entry.json.qualified.split('#')[0]
    entry.json.label = entry.json.qualified.split('#')[1]

    this._nextProcessor.process({
        level: LEVEL[entry.json.level],
        formatted: [],
        json: entry.json
    })
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(destructible, configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
