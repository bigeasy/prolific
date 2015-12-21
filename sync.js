var abend = require('abend')
var cadence = require('cadence')

var flush = cadence(function (async, queue, stdio) {
    var sink = queue.createSink(stdio)
    async(function () {
        sink.open(async())
    }, function () {
        sink.flush(async())
    }, function () {
        sink.flush(async())
    })
})

module.exports = function (queue, stdio) { flush(queue, stdio, abend) }
