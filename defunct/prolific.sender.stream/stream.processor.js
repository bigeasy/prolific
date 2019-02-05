var cadence = require('cadence')
var abend = require('abend')
var Signal = require('signal')
var stringify = require('prolific.stringify')

function Processor (stream) {
    this.stream = stream
    this._sending = new Signal
    this._sending.open = []
    this.lines = []
    this.sent = 0
}

Processor.prototype._nudge = function () {
    if (this._sending.open != null) {
        this._send(abend)
    }
}

Processor.prototype._send = cadence(function (async) {
    async([function () {
        this._sending.open = []
        this._sending.notify()
    }], function () {
        this._sending.open = null
        var loop = async(function () {
            if (this.lines.length == 0) {
                return [ loop.break ]
            }
            var lines = new Buffer(this.lines.join(''))
            this.lines = []
            this.sent += lines.length
            this.stream.write(lines, async())
        })()
    })
})

Processor.prototype.splice = function (lines) {
    this.lines.push.apply(this.lines, lines.splice(0, lines.length))
    this._nudge()
}

Processor.prototype.process = function (entry) {
    this.lines.push(stringify(entry))
    this._nudge()
}

Processor.prototype.flush = cadence(function (async) {
    this._sending.wait(async())
})

module.exports = Processor
