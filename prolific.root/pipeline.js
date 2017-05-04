var cadence = require('cadence')
var commandable = require('./commandable')

function Pipeline (configuration) {
    var nullProcessor = {
        open: function (callback) { callback() },
        process: function () {},
        close: function (callback) { callback() }
    }, nextProcessor = nullProcessor
    var processors = configuration.processors.map(function (configuration) {
        var Processor = require(configuration.moduleName)
        return nextProcessor = new Processor(configuration.parameters, nextProcessor)
    })
    processors.unshift(nullProcessor)
    this.processors = processors.reverse()
    this._opened = []
}

Pipeline.prototype.open = cadence(function (async) {
    async.forEach(function (processor) {
        async(function () {
            processor.open(async())
        }, function () {
            this._opened.push(processor)
        })
    })(this.processors)
})

Pipeline.prototype.close = cadence(function (async) {
    async.forEach(function (processor) {
        processor.close(async())
    })(this._opened)
})

Pipeline.parse = cadence(function (async, program, configuration) {
    var argv = program.argv.slice(), terminal = false
    var loop = async(function () {
        program.assert(argv.length != 0, 'no program')
        var parser = commandable(terminal, argv)
        if (parser == null) {
            return [ loop.break, configuration, argv, terminal ]
        }
        async(function () {
            parser(argv, {}, configuration, async())
        }, function (processor) {
            if (processor.moduleName) {
                configuration.processors.push(processor)
            }
            argv = processor.argv
            terminal = processor.terminal
        })
    })()
})

module.exports = Pipeline
