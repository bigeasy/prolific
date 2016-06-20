var slice = [].slice
var Reactor = require('reactor')
var cadence = require('cadence')

var forward = cadence(function (async, timeout, work) {
    if (work.async) {
        work.vargs.push(async())
    }
    work.object.send.apply(work.object, work.vargs)
})

module.exports = function (ipc, process, child) {
    if (ipc) {
        var down = new Reactor({ operation: forward, turnstiles: 256 })
        var up = new Reactor({ operation: forward, turnstiles: 256 })
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
