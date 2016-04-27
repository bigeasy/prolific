var Delta = require('delta')
var cadence = require('cadence')
var assert = require('assert')
var splice = [].splice
var Collector = require('prolific.collector')

function Interceptor (writer, senders) {
    this.writer = writer
    this.senders = senders
}

Interceptor.prototype.send = function (line) {
    this.writer.options.configuration = JSON.parse(line.toString())
    splice.apply(this.writer.senders, [ 0, 1 ].concat(this.senders))
}

function Writer (options, senders, forward) {
    this.options = options
    this.senders = forward ? senders :[ new Interceptor(this, senders) ]
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
            this.previous = this.collector.chunks.shift()
            for (var i = 0, I = this.senders.length; i < I; i++) {
                this.senders[i].send(this.previous.buffer)
            }
        }
    } else {
        while (this.collector.stderr.length) {
            this.forward.write(this.collector.stderr.shift())
        }
    }
}

module.exports = cadence(function (async, senders, child, asyncout, syncout, forward) {
    var options = {
        configuration: null
    }
    var log = {
        async: new Writer(options, senders),
        sync: new Writer(options, senders, forward)
    }
    async(function () {
        var delta = new Delta(async())
        delta.ee(child).on('exit')
             .ee(asyncout).on('data', log.async.ondata).on('end')
             .ee(syncout).on('data', log.sync.ondata).on('end')
    }, function (code, signal) {
        var previous = log.async.previous
        while (log.sync.collector.chunks.length) {
            var chunk = log.sync.collector.chunks.shift()
            // TODO Allow an initial duplicate for the flush race condition.
            assert.ok(chunk.previousChecksum == previous.checksum, 'previous mismatch')
            senders.forEach(function (sender) { sender.send(chunk.buffer) })
            previous = chunk
        }
        return [ code == null ? 1 : code, options.configuration ]
    })
})
