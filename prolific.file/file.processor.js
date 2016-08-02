var fs = require('fs')
var stream = require('stream')

var abend = require('abend')
var tz = require('timezone')
var cadence = require('cadence')
var Vestibule = require('vestibule')
var Delta = require('delta')

var stringify = require('prolific.monitor/stringify')
var Sender = require('prolific.sender.stream')

function Processor (parameters) {
    this._nullSender = {
        sent: Infinity,
        process: function (entry) { this.lines.push(stringify(entry)) },
        flush: function (callback) { callback() },
        _stream: new stream.PassThrough,
        lines: [],
        rotating: true
    }
    this._filename = parameters.params.file
    this._rotateSize = parameters.params.rotate || 1024 * 1024 * 1024
    this._pid = parameters.params.pid || process.pid
    this._sender = this._nullSender
    this._Date = parameters.Date || Date
    this._rotating = new Vestibule
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype._rotate = cadence(function (async) {
    this._sender = this._nullSender
    this._sender.sent = 0
    this._rotating.open = null
    var stream
    async(function () {
        this._flush(async())
    }, function () {
        var filename = this._filename + tz(this._Date.now(), '-%F-%H-%M-' + this._pid)
        stream = fs.createWriteStream(filename, { flags: 'a' })
        new Delta(async()).ee(stream).on('open')
    }, function () {
        this._sender = new Sender(stream)
        this._sender.splice(this._nullSender.lines)
        this._rotating.open = []
        this._rotating.notify()
    })
})

Processor.prototype._flush = cadence(function (async) {
    async(function () {
        this._sender.flush(async())
    }, function () {
// TODO Expose `stream` instead of `_stream`.
        this._sender._stream.end()
    })
})

Processor.prototype.process = function (entry) {
    this._sender.process(entry)
    if (this._sender.sent >= this._rotateSize) {
        this._rotate(abend)
    }
}

Processor.prototype.close = cadence(function (async) {
    async(function () {
        this._rotating.enter(async())
    }, function () {
        this._flush(async())
    })
})

module.exports = Processor
