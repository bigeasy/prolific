var coalesce = require('extant')

function Processor (nextProcessor) {
    this._nextProcessor = nextProcessor
}

Processor.prototype.process = function (entry) {
    if (/^(count|measure|sample)$/.test(entry.json.l2met)) {
        var json = entry.json
        var formatted = [ json.l2met.substring(0, 1), '#', json.label, '=', json.value, coalesce(json.unit, '') ]
        var separator = ' tags='
        for (var tag in json.tags || {}) {
            var value = json.tags[tag]
            formatted.push(separator, tag, ':', value)
            separator = ','
        }
        formatted.push('\n')
        entry.formatted.push(formatted.join(''))
    }
    this._nextProcessor.process(entry)
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(nextProcessor))
}

module.exports.isProlificProcessor = true
