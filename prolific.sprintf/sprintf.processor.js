var sprintf = require('sprintf-js').sprintf

function Processor (parameters, next) {
    this._format = parameters.format || 'json'
    this._extractors = parameters.extractors.map(function (source) {
        return new Function('$', 'return ' + source)
    })
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    var extracted = this._extractors.length == 0
        ? [ entry ]
        : this._extractors.map(function (extractor) {
            return extractor(entry)
        })

    entry.formatted.push(sprintf.apply(null, [ this._format ].concat(extracted)))

    this._next.process(entry)
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
