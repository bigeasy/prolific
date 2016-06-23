var Logger = require('prolific.logger')
var aggregates = {
    sum: require('./sum'),
    count: require('./count')
}

// TODO Considering 'level/qualifier#name' to specify output and using
// 'field:$.example' for field selectors and extractors.
function Processor (parameters) {
    var params = parameters.params
    this._in =  parameters.params['in']
    this._interval = +(params.interval || 30000)
    this._duration = +(params.duration || 60000)
    this._missing = params.missing == 'skip' ? null : +(params.missing)
    var out = (params.out || 'prolific.aggregate#summary').split('#')
    this._out = {
        logger: Logger.createLogger(out[0]),
        name: out[1]
    }
    parameters.ordered.forEach(function (parameter) {
        if (/^average|count|sum$/.test(parameter.name)) {
            var pair = parameter.value.split('=')
            var name = pair[0]
            this._operations.push({
                aggregate: new (aggregates[parameter.name])(),
                name: pair[0],
                select: new Function ('$', 'return ' + pair[1])
            })
        }
    })
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    if (entry.qualified == this._qualified) {
        this._operations.forEach(function (operation) {
            var value = operation.select.call(null, entry)
            operation.aggregate.sample(value == null ? this._null : value)
        }, this)
    }
}

Processor.prototype.interval = function () {
    var record = {}
    this._operations.forEach(function (operation) {
        record[operation.name] = operation.aggregate.summarize()
    }, this)
// TODO Need to be able to call a logger. So, prolific.monitor needs to set up a
// transport for prolific.
    this._logger.info(this._name, record)
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
