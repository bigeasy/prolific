var cadence = require('cadence')
var abend = require('abend')
var Vestibule = require('vestibule')
var stringify = require('prolific.monitor/stringify')

function Processor (stream) {
    this._stream = stream
    this._sending = new Vestibule
    this._sending.open = []
    this.lines = []
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
            var lines = this.lines
            this.lines = []
            this._stream.write(lines.join(''), async())
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
    this._sending.enter(async())
})

module.exports = Processor
