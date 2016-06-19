var cadence = require('cadence')
var push = [].push

function Processor (parameters) {
    this._configuration = parameters.configuration
    this._processors = null
    this._initialized = []
}

Processor.prototype.open = cadence(function (async) {
    this._processors = this._configuration.processors.map(function (configuration) {
        var Processor = require(configuration.moduleName)
        return new Processor(configuration.parameters)
    })
    this._processors.reverse()
    this._initialized = []
    async.forEach(function (processor) {
        async(function () {
            processor.open(async())
        }, function () {
            this._initialized.push(processor)
        })
    })(this._processors)
})

Processor.prototype.process = function (entry) {
    var entries = { input: [ entry ], output: [] }
    this._processors.forEach(function (processor) {
        entries.input.forEach(function (entry) {
            push.apply(entries.output, processor.process(entry))
        })
        entries = { input: entries.output, output: [] }
    })
    return [ entry ]
}

Processor.prototype.close = cadence(function (async) {
    var loop = async(function () {
        if (this._initialized.length == 0) {
            return [ loop.break ]
        }
        var processor = this._initialized.shift()
        processor.close(async())
    })()
})

module.exports = Processor
