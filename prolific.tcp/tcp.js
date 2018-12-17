var url = require('url')
var net = require('net')

var delta = require('delta')
var cadence = require('cadence')

var Turnstile = require('turnstile')
Turnstile.Check = require('turnstile/check')

var coalesce = require('extant')

function Processor (configuration) {
    this.turnstile = new Turnstile
    this.destroyed = false
    this._processing = new Turnstile.Check(this, '_process', this.turnstile)
    this._url = url.parse(configuration.url)
    this._entries = []
    this._socket = null
    this.written = 0
    this._rotate = coalesce(configuration.rotate, 1024 * 1024 * 16)
}

Processor.prototype.send = function (line) {
    if (!this.destroyed) {
        this._entries.push(line)
        this._processing.check()
    }
}

Processor.prototype._process = cadence(function (async, envelope) {
    async([function () {
        var chunk = Buffer.from(this._entries.splice(0).join(''))
        async(function () {
            if (chunk.length != 0) {
                async(function () {
                    if (this._socket == null) {
                        this._socket = new net.Socket
                        this._socket.setNoDelay(true)
                        this._socket.connect({ port: +this._url.port, host: this._url.hostname })
                        delta(async()).ee(this._socket).on('connect')
                    }
                }, function () {
                    this._socket.write(chunk, async())
                })
            }
        }, function () {
            this.written += chunk.length
            if (
                (this.destroyed || this.written >= this._rotate)
                && this._socket != null
            ) {
                this.written = 0
                this._socket.end(async())
            }
        }, function () {
            return []
        })
    }, function (error) {
        // TODO How to log?
        console.log(error.stack)
        this._socket = null
        this.written = 0
    }])
})

Processor.prototype.destroy = function () {
    if (!this.destroyed) {
        this.destroyed = true
        this._processing.check()
    }
}

module.exports = cadence(function (async, destructible, configuration) {
    var processor = new Processor(configuration)
    destructible.destruct.wait(processor, 'destroy')
    return processor
})
