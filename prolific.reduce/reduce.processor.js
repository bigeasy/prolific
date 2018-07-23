var url = require('url')
var Cache = require('magazine')
var merge = require('./merge')

var Evaluator = require('prolific.evaluator')

var coalesce = require('extant')

function Processor (parameters, next, options) {
    options || (options = {})
    this._timeout = coalesce(options.timeout, 30000)
    this._delay = coalesce(options.delay, 5000)
    this._pivot = Evaluator.create(parameters.pivot)
    this._end = Evaluator.create(parameters.end)
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
            got = this._building.get(pivot, { entry: {} })
        }
        merge(got.entry, entry)
        if (this._end.call(null, got.entry)) {
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
