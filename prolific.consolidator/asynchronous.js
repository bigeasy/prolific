var Collector = require('prolific.collector')

function Asynchronous (input) {
    var collector = new Collector(true)
    var chunks = this.chunks = []
    input.on('data', function (buffer) {
        collector.scan(buffer)
        Array.prototype.push.apply(chunks, collector.chunks.splice(0, collector.chunks.length))
    })
    this.sync = []
}

Asynchronous.prototype.consume = function (chunk) {
    this.sync.push(chunk)
}

Asynchronous.prototype.exit = function () {
    var chunks = this.sync
    while (chunks.length && chunks[0].number != this.chunkNumber) {
        chunks.shift()
    }
    Array.prototype.push.apply(this.chunks, chunks.splice(0, chunks.length))
}

module.exports = Asynchronous
