var Collector = require('prolific.collector')
var cadence = require('cadence')
var Staccato = require('staccato')

function Synchronous (input, forward) {
    var consumers = this._consumers = {}
    var backlog = this._backlog = {
        _chunks: [],
        consume: function (chunk) {
            this._chunks.push(chunk)
        },
        empty: function (pid, consumer) {
            this._chunks = this._chunks.filter(function (chunk) {
                if (chunk.pid == pid) {
                    consumer.consume(chunk)
                    return false
                }
                return true
            })
            var index = 0
        }
    }
}

Synchronous.prototype.listen = cadence(function (async, input, forward) {
    var collector = new Collector(false)
    var readable = new Staccato.Readable(input)
    var loop = async(function () {
        async(function () {
            readable.read(async())
        }, function (buffer) {
            if (buffer == null) {
                return [ loop.break ]
            }
            collector.scan(buffer)
            forward.write(collector.stderr.splice(0, collector.stderr.length).join(''))
            while (collector.chunks.length) {
                var chunk = collector.chunks.shift()
                var consumer = this._consumers[chunk.pid] || this._backlog
                chunk.buffer = chunk.buffer.toString('utf8')
                consumer.consume(chunk)
                if (chunk.eos) {
                    delete this._consumers[chunk.pid]
                }
            }
        })
    })()
})

Synchronous.prototype.addConsumer = function (pid, consumer) {
    this._backlog.empty(pid, consumer)
    this._consumers[pid] = consumer
}

module.exports = Synchronous
