var url = require('url')
var Cache = require('magazine')
var noop = require('nop')

var coalesce = require('extant')

var LEVEL = {
    trace: 0,
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
// TODO: Fatal.
}

function createFunction (source) {
    return new Function(
        '$', '$qualifier', '$level', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', '$gathered',
        'return ' + source
    )
}

function invokeFunction (f, entry) {
    return f.call(null, entry.json, entry.qualifier, entry.level, 4, 3, 2, 1, 0, 0, coalesce(entry.$gathered))
}

function Processor (parameters, next, options) {
    options || (options = {})
    this._timeout = coalesce(options.timeout, 30000)
    this._delay = coalesce(options.delay, 5000)
    this._pivot = createFunction(parameters.pivot)
    this._end = createFunction(parameters.end)
    this._calculations = parameters.calculate.forEach(function (calculate) {
        return createFunction(calculate)
    })
    this._gather = parameters.gather && createFunction(parameters.gather)
    this._building = new Cache().createMagazine()
    this._sending = new Cache().createMagazine()
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    this._maybeSend(this._sending, Date.now() - this._delay)
    this._maybeSend(this._building, Date.now() - this._timeout)

    var pivot = invokeFunction(this._pivot, entry)
    if (pivot == null) {
        this._next.process(entry)
    } else {
        var got = this._sending.get(pivot)
        if (got == null) {
            got = this._building.get(pivot, { entry: null })
            if (got.entry == null) {
                got.entry = entry
                if (this._gather != null) {
                    got.entry.json.$gathered = []
                }
            }
        }
        var gathered = invokeFunction(coalesce(this._gather, noop), entry)
        if (gathered != null) {
            got.entry.json.$gathered.push(gathered)
        }
        for (var key in entry.json) {
            if (!(key in got.entry.json)) {
                got.entry.json[key] = entry.json[key]
            }
        }
        if (invokeFunction(this._end, got.entry)) {
            this._sending.put(pivot, got)
            this._building.remove(pivot)
        }
    }
}

Processor.prototype._maybeSend = function (magazine, before) {
    var iterator = magazine.iterator()
    while (!iterator.end && iterator.when < before) {
        var entry = magazine.get(iterator.key)
        this._next.process(entry.entry)
        magazine.remove(iterator.key)
        iterator.previous()
    }
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
