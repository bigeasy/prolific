var url = require('url')
var Cache = require('magazine')
var merge = require('./merge')

var Evaluator = require('prolific.evaluator')

var coalesce = require('extant')

var SKIP = {}

'when, level, label, qualified, qualifier, pid'.split(/, /).forEach(function (skip) {
    SKIP[skip] = true
})

function Processor (destructible, configuration, nextProcessor, options) {
    this._timeout = coalesce(configuration.timeout, 30000)
    this._delay = coalesce(configuration.delay, 5000)
    this._pivot = Evaluator.create(configuration.pivot)
    this._end = Evaluator.create(configuration.end)
    this._building = new Cache().createMagazine()
    this._sending = new Cache().createMagazine()
    this._nextProcessor = nextProcessor
    this._arrivals = coalesce(configuration.arrivals, {})

    destructible.destruct.wait(this, function () {
        this._maybeSend(this._sending, Infinity)
        this._maybeSend(this._building, Infinity)
    })
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
                    path: entry.path,
                    level: entry.level,
                    qualifier: entry.qualifier,
                    formatted: entry.formatted,
                    json: {}
                }
            })
        }
        got.arrivals.push({
            qualified: entry.json.qualified,
            when: entry.json.when,
            offset: entry.json.when - got.when
        })
        merge(got.entry.json, entry.json, got.skip)
        got.skip = SKIP
        if (this._end.call(null, got.entry)) {
            got.entry.json.when = got.when
            var arrivals = got.arrivals
            if (this._arrivals.arrayed != null) {
                got.entry.json[this._arrivals.arrayed] = arrivals
            }
            if (this._arrivals.mapped != null) {
                var map = {}
                arrivals.forEach(function (arrival) {
                    map[arrival.qualified] = arrival
                })
                got.entry.json[this._arrivals.mapped] = map
            }
            var arrayed = this._arrayed
            this._sending.put(pivot, got)
            this._building.remove(pivot)
        }
    }
}

Processor.prototype._maybeSend = function (magazine, before) {
    var iterator = magazine.iterator()
    while (!iterator.end && iterator.when < before) {
        var entry = magazine.get(iterator.key)
        this._nextProcessor.process(entry.entry)
        magazine.remove(iterator.key)
        iterator.previous()
    }
}

module.exports = function (destructible, configuration, nextProcessor, callback) {
    callback(null, new Processor(destructible, configuration, nextProcessor))
}

module.exports.isProlificProcessor = true
