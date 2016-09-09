var fs = require('fs')
var stream = require('stream')

var abend = require('abend')
var cadence = require('cadence')
var Vestibule = require('vestibule')
var delta = require('delta')

var stringify = require('prolific/stringify')
var Sender = require('prolific.sender.stream')

function Processor (parameters, next) {
    this._nullSender = {
        sent: Infinity,
        process: function (entry) { this.lines.push(stringify(entry)) },
        flush: function (callback) { callback() },
        stream: new stream.PassThrough,
        lines: [],
        rotating: true
    }
    this._next = next
    this._filename = parameters.file
    this._rotateSize = parameters.rotate || 1024 * 1024 * 1024
    this._pid = parameters.pid || process.pid
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
        var stamp = new Date(this._Date.now())
            .toISOString()
            .replace(/[T.:]/g, '-')
            .replace(/-\d{2}-\d{3}Z$/, '')
        var filename = [ this._filename, stamp, this._pid ].join('-')
        stream = fs.createWriteStream(filename, { flags: 'a' })
        delta(async()).ee(stream).on('open')
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
        this._sender.stream.end()
    })
})

Processor.prototype.process = function (entry) {
    this._sender.process(entry)
    if (this._sender.sent >= this._rotateSize) {
        this._rotate(abend)
    }
    this._next.process(entry)
}

Processor.prototype.close = cadence(function (async) {
    async(function () {
        this._rotating.enter(async())
    }, function () {
        this._flush(async())
    })
})

module.exports = Processor
