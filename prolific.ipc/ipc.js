var slice = [].slice
var Turnstile = require('turnstile/redux')
Turnstile.Queue = require('turnstile/queue')
var cadence = require('cadence')

var forward = cadence(function (async, envelope) {
    var body = envelope.body
    if (body.async) {
        body.vargs.push(async())
    }
    body.object.send.apply(body.object, body.vargs)
})

module.exports = function (ipc, process, child) {
    if (ipc) {
        var turnstiles = {
            down: new Turnstile({ turnstiles: 256 }),
            up: new Turnstile({ turnstiles: 256 })
        }
        var down = new Turnstile.Queue(forward, turnstiles.down)
        var up = new Turnstile.Queue(forward, turnstiles.up)
        var async = +process.versions.node.split('.')[0] != 0
        process.on('message', function () {
            up.push({ async: async, object: child, vargs: slice.call(arguments) })
        })
        child.on('message', function () {
            down.push({ async: async, object: process, vargs: slice.call(arguments) })
        })
        function disconnect () {
            if (process.connected) {
                process.disconnect()
            }
        }
        process.on('SIGINT', disconnect)
        process.on('SIGTERM', disconnect)
    }
}
