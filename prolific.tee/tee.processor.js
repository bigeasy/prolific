var cadence = require('cadence')

var Pipeline = require('prolific.pipeline')

function Processor (pipeline, nextProcessor) {
    this._pipeline = pipeline
    this._nextProcessor = nextProcessor
}

Processor.prototype.process = function (entry) {
    this._pipeline.process(JSON.parse(JSON.stringify(entry)))
    this._nextProcessor.process(entry)
}

module.exports = cadence(function (async, destructible, configuration, nextProcessor) {
    async(function () {
        destructible.monitor('pipeline', Pipeline, configuration.pipeline, async())
    }, function (pipeline) {
        return new Processor(pipeline, nextProcessor)
    })
})

module.exports.isProlificProcessor = true
