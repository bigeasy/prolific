var cadence = require('cadence')

var coalesce = require('extant')

var Pipeline = require('prolific.pipeline')
var Acceptor = require('prolific.acceptor')

function Processor (pipeline, configuration, nextProcessor) {
    this._acceptor = new Acceptor(coalesce(configuration.accept, true), coalesce(configuration.chain, []))
    this._pipeline = pipeline
    this._nextProcessor = nextProcessor
    this._consume = !! configuration.consume
}

Processor.prototype.process = function (entry) {
    var forward = true
    if (this._acceptor.acceptByContext(entry)) {
        this._pipeline.process(JSON.parse(JSON.stringify(entry)))
        forward = ! this._consume
    }
    if (forward) {
        this._nextProcessor.process(entry)
    }
}

module.exports = cadence(function (async, destructible, configuration, nextProcessor) {
    async(function () {
        destructible.monitor('pipeline', Pipeline, configuration.pipeline, async())
    }, function (pipeline) {
        return new Processor(pipeline, configuration, nextProcessor)
    })
})

module.exports.isProlificProcessor = true
