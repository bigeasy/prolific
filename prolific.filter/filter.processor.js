var Acceptor = require('prolific.acceptor')

function Processor (configuration, nextProcessor) {
    this._acceptor = new Acceptor(configuration.accept, configuration.chain)
    this._nextProcessor = nextProcessor
}

Processor.prototype.process = function (entry) {
    if (this._acceptor.acceptByContext(entry)) {
        this._nextProcessor.process(entry)
    }
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
