function Processor () {
    var pair = parameters.params['with'].split('#')
    this._context = pair[0]
    this._name = pair[1]
    this._interval = +(parameter.params.interval || 30000)
    this._history = +(parameter.params.history || 60000)
    this._null = parameter.params['null'] == 'skip' ? null : +(parameter.params['null'])
    this._windows = []
    this._logger = require('prolific.logger').createLogger(parameters.param.name)
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
// TODO Flattening is now.
    if (entry.name == this._name && entry.context == this._context) {
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
