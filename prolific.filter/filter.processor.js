var LEVEL = {
    trace: 0,
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
// TODO: Fatal.
}

function Processor (parameters) {
    this._select = new Function(
        '$', '$context', '$level', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE',
        'return ' + parameters.params.select
    )
}

Processor.prototype.open = function (callback) { callback () }

Processor.prototype.process = function (entry) {
    var context = entry.context.split('.').map(function (value, index, set) {
        return set.slice(0, index + 1).join('.')
    })
    context.unshift(null)
    if (this._select.call(null, entry, context, LEVEL[entry.level], 4, 3, 2, 1, 0, 0)) {
        return [ entry ]
    }
    return []
}

Processor.prototype.close = function (callback) { callback () }

module.exports = Processor
