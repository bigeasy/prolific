var url = require('url')
var Cache = require('magazine')
var merge = require('./merge')

var Evaluator = require('prolific.evaluator')

var coalesce = require('extant')

var SKIP = {}

'when, level, label, qualified, qualifier, pid'.split(/, /).forEach(function (skip) {
    SKIP[skip] = true
})

function Processor (options) {
    this._timeout = coalesce(options.timeout, 30000)
    this._delay = coalesce(options.delay, 5000)
    this._building = new Cache().createMagazine()
    this._sending = new Cache().createMagazine()
}

Processor.prototype.merge = function (pivot, entry) {
    var got = this._sending.get(pivot)
    if (got == null) {
        got = this._building.get(pivot, {
            when: entry.when,
            skip: {},
            entry: JSON.parse(JSON.stringify(entry))
        })
        merge(got, entry, got.skip)
        got.skip = SKIP
    }
    return got
}

Processor.prototype.send = function (pivot) {
    var got = this._building.get(pivot)
    if (got != null) {
        this._sending.put(pivot, got)
        this._building.remove(pivot)
    }
}

Processor.prototype.ready = function (before) {
    return this._shift(this._sending, Date.now() - this._delay) ||
           this._shift(this._building, Date.now() - this._timeout)
}

Processor.prototype.shift = function () {
    return this._shift(this._sending, Infinity) ||
           this._shift(this._building, Infinity)
}

Processor.prototype._shift = function (magazine, before) {
    var iterator = magazine.iterator()
    if (iterator.when < before) {
        return magazine.remove(iterator.key)
    }
    return null
}

Processor.prototype.process = function (entry) {
    this._maybeSend(this._sending, Date.now() - this._delay)
    this._maybeSend(this._building, Date.now() - this._timeout)

    var pivot = this._pivot.call(null, entry)
    if (pivot == null) {
        this._nextProcessor.process(entry)
    } else {
        var got = this._sending.get(pivot)
        if (got == null) {
            got = this._building.get(pivot, {
                when: entry.json.when,
                arrivals: [],
                skip: {},
                entry: {
                    level: entry.level,
                    formatted: entry.formatted,
                    env: entry.env,
                    json: {}
                }
            })
        }
        got.arrivals.push({
            qualified: entry.json.qualified,
            when: entry.json.when,
            entry: entry,
            offset: entry.json.when - got.when
        })
        merge(got.entry.json, entry.json, got.skip)
        if (this._end.call(null, got.entry)) {
            this._sending.put(pivot, got)
            this._building.remove(pivot)
        }
    }
}

Processor.prototype._maybeSend = function (magazine, before) {
    var iterator = magazine.iterator()
    while (!iterator.end && iterator.when < before) {
        var got = magazine.get(iterator.key)
        got.entry.json.when = got.when
        var arrivals = got.arrivals
        if (this._arrivals.mapped != null) {
            var map = {}
            arrivals.forEach(function (arrival) {
                var name = this._arrivals.mapped.name.call(null, arrival.entry)
                map[name] = arrival.offset
            }, this)
            got.entry.json[this._arrivals.mapped.map] = map
        }
        if (this._arrivals.named != null) {
            arrivals.forEach(function (arrival) {
                var name = this._arrivals.named.call(null, arrival.entry)
                got.entry.json[name] = arrival.offset
            }, this)
        }
        if (this._arrivals.arrayed != null) {
            arrivals.forEach(function (arrival) {
                delete arrival.entry
            })
            got.entry.json[this._arrivals.arrayed] = arrivals
        }
        this._nextProcessor.process(got.entry)
        magazine.remove(iterator.key)
        iterator.previous()
    }
}

module.exports = Processor
