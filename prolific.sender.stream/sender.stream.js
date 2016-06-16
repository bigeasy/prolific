var cadence = require('cadence')
var Reactor = require('reactor')
var fs = require('fs')

function Processor (stream, close) {
    this._sending = new Reactor({ object: this, method: '_send' })
    this._stream = stream
    this._close = close
}

Processor.prototype.send = function (chunk, callback) {
    this._sending.push(chunk, callback || null)
}

Processor.prototype._send = cadence(function (async, timeout, chunk) {
    this._stream.write(chunk.buffer, async())
})

Processor.prototype.close = cadence(function (async) {
    async(function () {
        this.send({ buffer: new Buffer(0) }, async())
    }, function () {
        if (this._close) {
            this._stream.end(async())
        }
    })
})

module.exports = Processor
