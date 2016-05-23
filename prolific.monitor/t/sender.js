var fs = require('fs')
var Queue = require('prolific.queue')
var cadence = require('cadence')

var queue = new Queue

cadence(function (async) {
    async(function () {
        queue.write(JSON.stringify({
            moduleName: 'prolific.sender.test',
            argv: process.argv.slice(2)
        }))
        queue.exit(process.stderr)
    })
})(function (error) { if (error) console.log(error.stack) })
