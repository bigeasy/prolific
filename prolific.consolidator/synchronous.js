var Collector = require('prolific.collector')
var cadence = require('cadence')
var Staccato = require('staccato')

function Synchronous (controller) {
    this._controller = controller
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
            async(function () {
                var chunks = async(function () {
                    if (collector.chunks.length == 0) {
                        return [ chunks.break ]
                    }
                    var chunk = collector.chunks.shift()
                    var consumer = this._consumers[chunk.id]
                    if (consumer == null) {
                        this._controller.selectConsumer(chunk)
                        consumer = this._consumers[chunk.id]
                    }
                    chunk.buffer = chunk.buffer.toString('utf8')
                    consumer.consume(chunk, async())
                })()
            }, function () {
                this._controller.scanned(buffer.length)
            })
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
