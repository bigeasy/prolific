var fs = require('fs')
var Queue = require('prolific.queue')
var cadence = require('cadence')

var queue = new Queue

var sink = queue.createSink(fs.createWriteStream(null, { fd: +process.env.PROLIFIC_LOGGING_FD }))

cadence(function (async) {
    async(function () {
        queue.write(JSON.stringify({
            moduleName: 'prolific.sender.test',
            argv: process.argv.slice(2)
        }))
        sink.open(async())
    }, function () {
        sink.flush(async())
    })
})(function (error) { if (error) console.log(error) })
