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
        'return ' + parameter.params.select
    )
}

Processor.open = function (callback) { callback () }

Processor.process = function (entry) {
    var amalgamated = {}
    for (var key in entry.common) {
        amalgamated[key] = entry.common[key]
    }
    for (var key in entry.specific) {
        amalgamated[key] = entry.specific[key]
    }
    for (var key in entry) {
        if (key != 'common' && key != 'specific') {
            amalgamated[key] = entry.specific[key]
        }
    }
    var context = entry.context.split('.').map(function (value, index, set) {
        return set.slice(0, index + 1).join('.')
    })
    if (this._select.call(null, context, amalgamated, LEVEL[entry.level], 4, 3, 2, 1, 0, 0)) {
        return [ entry ]
    }
    return []
}

Processor.close = function (callback) { callback () }

module.exports = Processor
