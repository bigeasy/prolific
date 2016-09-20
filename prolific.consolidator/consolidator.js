var push = [].push

var Collector = require('prolific.collector')

function Writer (consolidator, async) {
    this.async = async
    this.collector = new Collector(async)
    this.consolidator = consolidator
    this.previous = { checksum: 0xaaaaaaaa }
    this.chunkNumber = 1
}

Writer.prototype.data = function (buffer) {
    this.collector.scan(buffer)
    if (this.async) {
        this.chunkNumber = this.collector.chunkNumber
        push.apply(this.consolidator.chunks, this.collector.chunks.splice(0, this.collector.chunks.length))
    } else {
        push.apply(this.consolidator.stderr,
            this.collector.stderr.splice(0, this.collector.stderr.length))
    }
}

function Consolidator () {
    var writers = {
        async: new Writer(this, true),
        sync: new Writer(this, false)
    }
    this.async = {
        writer: writers.async,
        ondata: writers.async.data.bind(writers.async)
    }
    this.sync = {
        writer: writers.sync,
        ondata: writers.sync.data.bind(writers.sync)
    }
    this.chunks = []
    this.stderr = []
}

Consolidator.prototype.exit = function () {
    var chunks = this.sync.writer.collector.chunks
    while (chunks.length && chunks[0].number != this.async.writer.chunkNumber) {
        chunks.shift()
    }
    push.apply(this.chunks, chunks.splice(0, chunks.length))
}

module.exports = Consolidator
