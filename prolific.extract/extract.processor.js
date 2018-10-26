var url = require('url')
var LEVEL = require('prolific.level')

var Evaluator = require('prolific.evaluator')
var coalesce = require('extant')

function Processor (destructible, configuration, nextProcessor) {
    this._extract = Evaluator.create(configuration.extract)
    this._consume = coalesce(configuration.consume, false)
    this._qualified = configuration.qualified
    this._qualifier = configuration.qualified.split('#')[0]
    this._label = configuration.qualified.split('#')[1]
    this._level = coalesce(configuration.level, 'notice')
    this._nextProcessor = nextProcessor
}

Processor.prototype.process = function (entry) {
    var extracted = this._extract.call(null, entry)

    extracted.qualified = this._qualified
    extracted.qualifier = this._qualifier
    extracted.label = this._label
    extracted.level = this._level
    extracted.when = coalesce(extracted.when, entry.json.when)
    extracted.pid = coalesce(extracted.pid, entry.json.pid)

    this._nextProcessor.process({
        level: LEVEL[this._level],
        formatted: [],
        json: extracted
    })

    if (!this._consume) {
        this._nextProcessor.process(entry)
    }
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(destructible, configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
