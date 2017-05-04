var Collector = require('prolific.collector')

function Asynchronous (input, consumer) {
    var collector = new Collector(true)
    var asynchronous = this
    input.on('data', function (buffer) {
        collector.scan(buffer)
        while (collector.chunks.length) {
            var chunk = collector.chunks.shift()
            asynchronous._chunkNumber = chunk.number
            consumer(chunk)
        }
    })
    this._chunkNumber = null
    this._consumer = consumer
    this._sync = []
}

Asynchronous.prototype.consume = function (chunk) {
    this._sync.push(chunk)
}

Asynchronous.prototype.exit = function () {
    var chunks = this._sync
    while (chunks.length && chunks[0].number <= this._chunkNumber) {
        chunks.shift()
    }
    while (chunks.length) {
        this._consumer.call(null, chunks.shift())
    }
}

module.exports = Asynchronous
