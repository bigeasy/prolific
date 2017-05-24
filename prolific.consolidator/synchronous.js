var Collector = require('prolific.collector')

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
    var collector = new Collector(false)
    input.on('data', function (buffer) {
        collector.scan(buffer)
        forward.write(collector.stderr.splice(0, collector.stderr.length).join(''))
        while (collector.chunks.length) {
            var chunk = collector.chunks.shift()
            var consumer = consumers[chunk.pid] || backlog
            chunk.buffer = chunk.buffer.toString('utf8')
            consumer.consume(chunk)
            if (chunk.eos) {
                delete consumers[chunk.pid]
            }
        }
    })
}

Synchronous.prototype.addConsumer = function (pid, consumer) {
    this._backlog.empty(pid, consumer)
    this._consumers[pid] = consumer
}

module.exports = Synchronous
