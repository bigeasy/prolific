var Delta = require('delta')
var cadence = require('cadence')
var assert = require('assert')
var Collector = require('./collector')

function Writer (sender, dedicated) {
    this.sender = sender
    this.collector = new Collector(dedicated)
    this.dedicated = dedicated
    this.ondata = this.data.bind(this)
    this.previous = { checksum: 0 }
}

Writer.prototype.data = function (buffer) {
    this.collector.scan(buffer)
    if (this.dedicated) {
        while (this.collector.chunks.length) {
            this.sender.send(this.previous = this.collector.chunks.shift())
        }
    } else {
        while (this.collector.stderr.length) {
            // TODO Pass this in.
            process.stderr.write(this.collector.stderr.shift())
        }
    }
}

module.exports = cadence(function (async, sender, child, asyncout, syncout) {
    var io = {
        asynclog: new Writer(sender, true),
        synclog: new Writer(sender, false)
    }
    async(function () {
        var delta = new Delta(async())
        delta.ee(child).on('close')
             .ee(asyncout).on('data', io.asynclog.ondata)
             .ee(syncout).on('data', io.synclog.ondata)
    }, function (code, signal) {
        var previous = io.asynclog.previous
        while (io.synclog.collector.chunks.length) {
            var chunk = io.synclog.collector.chunks.shift()
            // TODO Allow an initial duplicate for the flush race condition.
            assert.ok(chunk.previousChecksum == previous.checksum, 'previous mismatch')
            sender.send(chunk)
            previous = chunk
        }
        async(function () {
            sender.close(async())
        }, function () {
            return [ code, signal ]
        })
    })
})
