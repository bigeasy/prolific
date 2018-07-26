var url = require('url')
var coalesce = require('extant')

var FACILITY = require('prolific.facility')

var LEVEL = require('prolific.level')

function Processor (configuration, nextProcessor) {
    this._application = configuration.application || process.title
    this._hostname = configuration.hostname || 'localhost'
    this._facility = FACILITY[configuration.facility || 'local0']
    this._serializer = configuration.serializer ? require(configuration.serializer) : JSON
    this._nextProcessor = nextProcessor
}

Processor.prototype.process = function (entry) {
    var json = entry.json, pid = json.pid, when = json.when
    delete json.when
    delete json.pid
    var line = [
        '<' + (this._facility * 8 + LEVEL[entry.json.level]) + '>1',
        new Date(when).toISOString(),
        this._hostname,
        this._application,
        coalesce(pid, '-'),
        '-',
        '-',
        this._serializer.stringify(json)
    ]
    json.when = when
    json.pid = pid
    entry.formatted.push(line.join(' ') + '\n')
    this._nextProcessor.process(entry)
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
