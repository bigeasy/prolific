var Collector = require('prolific.collector')
var cadence = require('cadence')
var Staccato = require('staccato')

function Asynchronous (consumer) {
    this._chunkNumber = null
    this._consumer = consumer
    this._sync = []
    this._readable = null
}

Asynchronous.prototype.listen = cadence(function (async, input) {
    var collector = new Collector(true)
    this._readable = new Staccato.Readable(input)
    async.loop([], function () {
        async(function () {
            this._readable.read(async())
        }, function (buffer) {
            if (buffer == null) {
                return [ async.break ]
            }
            collector.scan(buffer)
            while (collector.chunks.length) {
                this._chunk(collector.chunks.shift())
            }
        })
    })
})

Asynchronous.prototype.push = function (chunk) {
    if (chunk.eos) {
        this.exit()
    } else {
        this._sync.push(chunk)
    }
}

Asynchronous.prototype._chunk = function (chunk) {
    this._chunkNumber = chunk.number
    this._consumer.push(chunk)
}

Asynchronous.prototype.exit = function () {
    // TODO Must shutdown asynchronous scanning also, kill readable or set flag.
    this._readable.destroy()
    var chunks = this._sync.splice(0, this._sync.length)
    while (chunks.length && chunks[0].number <= this._chunkNumber) {
        chunks.shift()
    }
    while (chunks.length) {
        this._chunk(chunks.shift())
    }
}

module.exports = Asynchronous
