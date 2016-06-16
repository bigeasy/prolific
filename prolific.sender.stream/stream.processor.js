var cadence = require('cadence')
var abend = require('abend')

function Processor (stream) {
    this._stream = stream
    this._sending = false
    this.lines = []
}

Processor.prototype.process = function (entry) {
    this.lines.push(entry.formatted || JSON.stringify(entry) + '\n')
    if (!this._sending) {
        this._send(abend)
    }
}

Processor.prototype._send = cadence(function (async) {
    async([function () {
        this._sending = false
    }], function () {
        this._sending = true
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

module.exports = Processor
