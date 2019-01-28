var fs = require('fs')
var stream = require('stream')

var Staccato = require('staccato')

var coalesce = require('extant')

var abend = require('abend')
var cadence = require('cadence')
var Signal = require('signal')
var delta = require('delta')

var Turnstile = require('turnstile')
Turnstile.Check = require('turnstile/check')

function Processor (options) {
    this._rotation = coalesce(options.rotate, Infinity)
    this.turnstile = new Turnstile
    this._processing = new Turnstile.Check(this, '_process', this.turnstile)
    this._writable = new Staccato.Writable(new stream.PassThrough)
    this._filename = options.file
    this._rotateSize = coalesce(options.rotate, 1024 * 1024 * 1024)
    this._pid = coalesce(options.pid, process.pid)
    this._sender = this._nullSender
    this._Date = coalesce(options.Date, Date)
    this._rotating = new Signal
    this._buffers = []
}

Processor.prototype._process = cadence(function (async, line) {
    async.loop([], function () {
        if (this._buffers.length == 0) {
            return [ async.break ]
        }
        this._written += this._buffers[0].length
        this._writable.write(this._buffers.shift(), async())
    }, function () {
        if (this._written >= this._rotation) {
            this._rotate(async())
        }
    })
})

// Note that we're only going to rotate every minute even if your rotation limit
// is hit within the minute. We're going to generate a file name where the stamp
// is based on the current minute, so if we get a rotation in the same minute we
// just reopen the existing minute file and continue appending. Not going to
// over-think this. If you're filling up files for real that quickly you've got
// a problem to solve and I'm not here to solve that particular problem for you.
//
Processor.prototype._rotate = cadence(function (async) {
    var stream
    async(function () {
        this._writable.end(async())
    }, function () {
        this._written = 0
        var stamp = new Date(this._Date.now())
            .toISOString()
            .replace(/[T.:]/g, '-')
            .replace(/-\d{2}-\d{3}Z$/, '')
        var filename = [ this._filename, this._pid, stamp ].join('-')
        var stream = fs.createWriteStream(filename, { flags: 'a' })
        this._writable = new Staccato.Writable(stream)
        delta(async()).ee(stream).on('open')
    })
})

Processor.prototype.process = function (buffer) {
    if (!this.destroyed) {
        if (!Buffer.isBuffer(buffer)) {
            buffer = Buffer.from(buffer)
        }
        this._buffers.push(buffer)
        this._processing.check()
    }
}

Processor.prototype._end = cadence(function (async) {
    async(function () {
        this.turnstile.listen(async())
    }, function () {
        this._writable.end(async())
    })
})

module.exports = cadence(function (async, destructible, options) {
    var processor = new Processor(options)
    destructible.destruct.wait(processor.turnstile, 'destroy')
    processor._end(destructible.durable('turnstile'))
    async(function () {
        processor._rotate(async())
    }, function () {
        return [ processor ]
    })
})
