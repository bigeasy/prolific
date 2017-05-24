var Synchronous = require('prolific.consolidator/synchronous')
var Asynchronous = require('prolific.consolidator/asynchronous')
var delta = require('delta')
var rescue = require('rescue')
var cadence = require('cadence')
var push = [].push

var LEVEL = {
    trace: 0,
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
// TODO: Fatal.
}

module.exports = cadence(function (async, processor, child, io, forward) {
    var configuration = null

    var synchronous = new Synchronous(io.sync, forward)
    var asynchronous = new Asynchronous(io.async, processor)
    synchronous.addConsumer('0', asynchronous)

    async(function () {
        async([function () {
            delta(async()).ee(child).on('exit')
                          .ee(io.sync).on('end')
                          .ee(io.async).on('end')
        }, function (error) {
            child.kill()
// TODO Revisit this. Which operating system generated this error?
// Error was ECONNRESET.
            console.log(error.stack)
        }])
    }, function (code, signal) {
        asynchronous.exit()
        return [ code == null ? 1 : code, configuration ]
    })
})
