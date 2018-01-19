var coalesce = require('extant')
var cadence = require('cadence')
var Logger = require('prolific.logger')

var aggregates = {
    sum: require('./sum'),
    count: require('./count')
}

// TODO Considering 'level/qualifier#name' to specify output and using
// 'field:$.example' for field selectors and extractors.
function Processor (parameters) {
    this._in =  parameters['in']
    this._interval = +(parameters.interval || 30000)
    this._duration = +(parameters.duration || 60000)
    this._operations = []
    this._timer = null
    var out = coalesce(parameters.out, 'prolific.aggregate#summary').split('#')
    this._out = {
        logger: Logger.createLogger(out[0]),
        name: out[1]
    }
    parameters.aggregations.forEach(function (parameter) {
        if (/^average|count|sum$/.test(parameter.name)) {
            var pair = parameter.value.split('=')
            var name = pair[0]
            this._operations.push({
                aggregate: new (aggregates[parameter.name])(),
                name: pair[0],
                select: new Function ('$', 'return ' + (pair[1] || 'true') )
            })
        }
    }, this)
}

Processor.prototype.open = cadence(function (async) {
    this._clearInterval()
    this._timer = setInterval(this.interval.bind(this), this._interval)
    return []
})

Processor.prototype.process = function (entry) {
    if (entry.qualified == this._in) {
        this._operations.forEach(function (operation) {
            var value = operation.select.call(null, entry)
            if (typeof value == 'number') {
                operation.aggregate.sample(value)
            }
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
    this._out.logger.info(this._out.name, record)
}

Processor.prototype._clearInterval = function () {
    if (this._timer) {
        clearInterval(this._timer)
        this._timer = null
    }
}

Processor.prototype.close = cadence(function (async) {
    this._clearInterval()
    return []
})

module.exports = Processor
