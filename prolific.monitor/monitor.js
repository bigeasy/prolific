var Delta = require('delta')
var cadence = require('cadence')
var assert = require('assert')
var Collector = require('prolific.collector')

function Writer (sender, forward) {
    this.sender = sender
    this.collector = new Collector(! forward)
    this.forward = forward
    this.dedicated = ! forward
    this.ondata = this.data.bind(this)
    this.previous = { checksum: 0xaaaaaaaa }
}

Writer.prototype.data = function (buffer) {
    this.collector.scan(buffer)
    if (this.dedicated) {
        while (this.collector.chunks.length) {
            this.sender.send((this.previous = this.collector.chunks.shift()).buffer)
        }
    } else {
        while (this.collector.stderr.length) {
            this.forward.write(this.collector.stderr.shift())
        }
    }
}

module.exports = cadence(function (async, sender, child, asyncout, syncout, forward) {
    var log = {
        async: new Writer(sender),
        sync: new Writer(sender, forward)
    }
    async(function () {
        var delta = new Delta(async())
        delta.ee(child).on('close')
             .ee(asyncout).on('data', log.async.ondata)
             .ee(syncout).on('data', log.sync.ondata)
    }, function (code, signal) {
        var previous = log.async.previous
        while (log.sync.collector.chunks.length) {
            var chunk = log.sync.collector.chunks.shift()
            // TODO Allow an initial duplicate for the flush race condition.
            assert.ok(chunk.previousChecksum == previous.checksum, 'previous mismatch')
            sender.send(chunk.buffer)
            previous = chunk
        }
        return [ code == null ? 1 : code ]
    })
})
