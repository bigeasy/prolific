var assert = require('assert')
var cadence = require('cadence')

module.exports = cadence(function (async, destructible, pipeline) {
    var nullProcessor = {
        process: function () {}
    }
    var nextProcessor = nullProcessor
    async(function () {
        async.map(function (configuration, index) {
            var Processor = require(configuration.module)
            assert(Processor.isProlificProcessor, 'not a Prolific processor module')
            destructible.monitor([ 'processor', index ], Processor, configuration, nextProcessor, async())
        })(pipeline.slice().reverse())
    }, function (processors) {
        processors.reverse()
        processors.push(nullProcessor)
        return [ processors[0], destructible ]
    })
})
