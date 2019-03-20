var cadence = require('cadence')
var Staccato = require('staccato')

module.exports = cadence(function (async, collector, stderr) {
    var readable = new Staccato.Readable(stderr)
    async.loop([], function () {
        async(function () {
            readable.read(async())
        }, function (buffer) {
            if (buffer == null) {
                collector.end()
                return [ async.break ]
            }
            collector.scan(buffer)
        })
    })
})
