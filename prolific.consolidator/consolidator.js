var cadence = require('cadence')
var byline = require('byline')
var Staccato = require('staccato')

function Consolidator (asynchronous, synchronous, queue) {
    this._exited = false
    this._series = 1
    this._readable = {
        asynchronous: new Staccato.Readable(byline(asynchronous)),
        synchronous: new Staccato.Readable(byline(synchronous))
    }
    this._queue = queue
}

Consolidator.prototype.asynchronous = cadence(function (async) {
    async.loop([], function () {
        async(function () {
            this._readable.asynchronous.read(async())
        }, function  (line) {
            if (line == null) {
                return [ async.break ]
            }
            this._queue.push(JSON.parse(line.toString()))
            this._series++
        })
    })
})

Consolidator.prototype.synchronous = cadence(function (async) {
    async.loop([], function () {
        async(function () {
            this._readable.synchronous.read(async())
        }, function  (line) {
            if (line == null) {
                this.exit()
                return [ async.break ]
            }
            this._synchronous(JSON.parse(line.toString()))
        })
    })
})

Consolidator.prototype._synchronous = function (chunk) {
    this._readable.asynchronous.destroy()
    switch (chunk.method) {
    case 'entries':
        if (chunk.series == this._series) {
            this._series++
            this._queue.push(chunk.entries)
        }
        break
    case 'exit':
        this._exited = true
        this._readable.synchronous.destroy()
        this._queue.push([[{ method: 'exit' }]])
        break
    }
}

Consolidator.prototype.exit = function () {
    if (!this._exited) {
        this._synchronous({ method: 'exit' })
    }
}

module.exports = Consolidator
