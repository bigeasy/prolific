var url = require('url')
var Cache = require('magazine')
var noop = require('nop')

var Evaluator = require('prolific.evaluator')

var coalesce = require('extant')

function Processor (parameters, next, options) {
    options || (options = {})
    this._timeout = coalesce(options.timeout, 30000)
    this._delay = coalesce(options.delay, 5000)
    this._pivot = Evaluator.create(parameters.pivot)
    this._end = Evaluator.create('$gathered', parameters.end)
    this._calculations = parameters.calculate.forEach(function (calculate) {
        return Evaluator.create('$gathered', calculate)
    })
    this._gather = parameters.gather && Evaluator.create(parameters.gather)
    this._building = new Cache().createMagazine()
    this._sending = new Cache().createMagazine()
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    this._maybeSend(this._sending, Date.now() - this._delay)
    this._maybeSend(this._building, Date.now() - this._timeout)

    var pivot = this._pivot.call(null, entry)
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
        var gathered = coalesce(this._gather, noop)(entry)
        if (gathered != null) {
            got.entry.json.$gathered.push(gathered)
        }
        for (var key in entry.json) {
            if (!(key in got.entry.json)) {
                got.entry.json[key] = entry.json[key]
            }
        }
        if (this._end.call(null, got.entry, coalesce(got.entry.json.$gathered))) {
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
