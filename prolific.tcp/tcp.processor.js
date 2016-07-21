var cadence = require('cadence')
var Reactor = require('reactor')
var url = require('url')
var delta = require('delta')
var net = require('net')

var stringify = require('prolific.monitor/stringify')

function Processor (parameters, next) {
    var params = parameters.params
    this._processing = new Reactor({ object: this, method: '_process' })
    this._url = url.parse(params.url)
    this._entries = []
    this._next = next
    this._socket = null
    this._written = 0
    this._rotate = params.rotate ? +params.rotate : 1024 * 1024 * 16
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    this._entries.push(stringify(entry))
    this._processing.check()
    this._next.process(entry)
}

Processor.prototype._write = cadence(function (async, chunk) {
    async([function () {
        this._socket.write(chunk, async())
    }, function (error) {
        this._written = 0
        this._socket = null
    }])
})

Processor.prototype._end = cadence(function (async) {
    async([function () {
        if (this._socket != null) {
            var socket = this._socket
            this._written = 0
            this._socket = null
            socket.end()
        }
    }, function (error) {
    }])
})

Processor.prototype._process = cadence(function (async, timeout) {
    if (this._entries.length == 0) {
        return []
    }
    var chunk = Buffer.concat(this._entries)
    var length = this._entries.length
    async(function () {
        if (this._socket == null) {
            this._socket = new net.Socket
            this._socket.setNoDelay(true)
            this._socket.connect({ port: +this._url.port, host: this._url.hostname })
            delta(async()).ee(this._socket).on('connect')
        }
    }, function () {
        this._write(chunk, async())
    }, function () {
        this._written += chunk.length
        this._entries.splice(0, length)
        if (this._written >= this._rotate) {
            this._end(async())
        }
    }, function () {
        return []
    })
})

Processor.prototype.close = cadence(function (async) {
    async(function () {
        this._processing.check(async())
    }, function () {
        this._end(async())
    })
})

module.exports = Processor
