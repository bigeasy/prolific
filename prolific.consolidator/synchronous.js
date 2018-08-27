var Collector = require('prolific.collector')
var cadence = require('cadence')
var Staccato = require('staccato')

function Synchronous (selectConsumer) {
    this._selectConsumer = selectConsumer
    this._consumers = {}
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
                var consumer = this._consumers[chunk.id]
                if (consumer == null) {
                    this._selectConsumer.call(null, chunk.id)
                    consumer = this._consumers[chunk.id]
                }
                chunk.buffer = chunk.buffer.toString('utf8')
                consumer.consume(chunk)
                if (chunk.eos) {
                    delete this._consumers[chunk.id]
                }
            }
        })
    })()
})

Synchronous.prototype.setConsumer = function (id, consumer) {
    this._consumers[id] = consumer
}

Synchronous.prototype.clearConsumer = function (id) {
    delete this._consumers[id]
}

module.exports = Synchronous
