var cadence = require('cadence')
var Staccato = require('staccato')
var byline = require('byline')

module.exports = function (completed) {
    return cadence(function (async, stdin, consumer) {
        var readable = new Staccato.Readable(byline(stdin))
        async.loop([], function () {
            readable.read(async())
        }, function (chunk) {
            if (chunk == null) {
                return [ async.break ]
            }
            var json = JSON.parse(chunk.toString())
            consumer.push(json)
            if (json.eos) {
                completed()
            }
        })
    })
}
