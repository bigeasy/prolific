var cadence = require('cadence')

var Pipeline = require('prolific.pipeline')

function Processor (parameters, next) {
    this._pipeline = new Pipeline(parameters.configuration)
    this._next = next
}

Processor.prototype.open = cadence(function (async) {
    this._pipeline.open(async())
})

Processor.prototype.process = function (entry) {
    this._pipeline.processors[0].process(JSON.parse(JSON.stringify(entry)))
    this._next.process(entry)
}

Processor.prototype.close = cadence(function (async) {
    this._pipeline.close(async())
})

module.exports = Processor
