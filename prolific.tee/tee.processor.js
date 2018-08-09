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
    console.log('got', entry)
    if (this._acceptor.acceptByContext(entry)) {
        console.log('accepted')
        this._pipeline.process(JSON.parse(JSON.stringify(entry)))
        forward = ! this._consume
    }
    console.log('forward', forward)
    if (forward) {
        this._nextProcessor.process(entry)
    }
    console.log('processed')
}

module.exports = cadence(function (async, destructible, configuration, nextProcessor) {
    console.log('rebuilding')
    async(function () {
        destructible.monitor('pipeline', Pipeline, configuration.pipeline, async())
    }, function (pipeline) {
        return new Processor(pipeline, configuration, nextProcessor)
    })
})

module.exports.isProlificProcessor = true
