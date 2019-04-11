var delta = require('delta')
var cadence = require('cadence')

var Procession = require('procession')

var coalesce = require('extant')

var UserAgent = require('vizsla')

function Processor (options) {
    this.destroyed = false

    this._queue = new Procession
    this._shifter = this._queue.shifter()
    this._join = coalesce(options.join)
    this._maxLength = coalesce(options.maxLength, Infinity)
    this._ua = new UserAgent().bind(options.fetch)
}

Processor.prototype.send = function (line) {
    if (!this.destroyed) {
        this._queue.push(line)
    }
}

Processor.prototype._process = cadence(function (async) {
    async.loop([], function () {
        async(function () {
            this._shifter.dequeue(async())
        }, function (payload) {
            if (payload == null) {
                return [ async.break ]
            }
            this.written++
            if (this._join == null) {
                payload = Buffer.from(payload)
            } else {
                var join = Buffer.from(this._join)
                var buffer = Buffer.from(payload)
                var lines = [ buffer ]
                var length = buffer.length
                var line
                while (length < this._maxLength && (line = this._shifter.shift()) != null) {
                    this.written++
                    length += join.length
                    lines.push(join)
                    buffer = Buffer.from(line)
                    length += buffer.length
                    lines.push(buffer)
                }
                payload = Buffer.concat(lines)
            }
            // TODO Retry.
            this._ua.fetch({
                post: payload
            }, async())
        })
    })
})

Processor.prototype.destroy = function () {
    if (!this.destroyed) {
        this.destroyed = true
        this._shifter.destroy()
    }
}

module.exports = cadence(function (async, destructible, options) {
    var processor = new Processor(options)
    processor._process(destructible.durable('http'))
    destructible.destruct.wait(processor, 'destroy')
    return processor
})
