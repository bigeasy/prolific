var LEVEL = {
    trace: 0,
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
// TODO: Fatal.
}

function Processor (parameters, next) {
    this._select = new Function(
        '$', '$qualifier', '$level', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE',
        'return ' + parameters.params.select
    )
    this._next = next
}

Processor.prototype.open = function (callback) { callback () }

Processor.prototype.process = function (entry) {
    if (this._select.call(null, entry.json, entry.qualifier, entry.level, 4, 3, 2, 1, 0, 0)) {
        this._next.process(entry)
    }
}

Processor.prototype.close = function (callback) { callback () }

module.exports = Processor
