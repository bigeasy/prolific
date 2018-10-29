var url = require('url')
var LEVEL = require('prolific.level')

var Evaluator = require('prolific.evaluator')
var coalesce = require('extant')

function Processor (destructible, configuration, nextProcessor) {
    this._common = Evaluator.create(coalesce(configuration.common, '{}'))
    this._consume = coalesce(configuration.consume, false)
    this._qualifier = configuration.qualifier
    this._level = coalesce(configuration.level, 'notice')
    this._nextProcessor = nextProcessor
    var extractions = {}
    for (var qualified in configuration.extract) {
        var extractor = Evaluator.create(configuration.extract[qualified])
        if (!~qualified.indexOf('#')) {
            qualified = this._qualifier + '#' + qualified
        }
        extractions[qualified] = extractor
    }
    this._extractions = extractions
}

Processor.prototype.process = function (entry) {
    for (var qualified in this._extractions) {
        var common = this._common.call(null, entry)
        var extracted = this._extractions[qualified].call(null, entry)
        for (var key in extracted) {
            common[key] = extracted[key]
        }
        var split = qualified.split('#')
        common.qualified = qualified
        common.qualifier = split[0]
        common.label = split[1]
        common.level = coalesce(common.level, this._level)
        common.when = coalesce(common.when, entry.json.when)
        common.pid = coalesce(common.pid, entry.json.pid)
        this._nextProcessor.process({
            level: LEVEL[this._level],
            formatted: [],
            env: entry.env,
            json: common
        })
    }

    if (!this._consume) {
        this._nextProcessor.process(entry)
    }
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(destructible, configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
