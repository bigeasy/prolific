var Queue = require('prolific.queue')
var createUncaughtExceptionHandler = require('./uncaught')
var abend = require('abend')

function Shuttle (input, output, sync, uncaught, process) {
    this.input = input
    this.output = output
    this.queue = new Queue(output)
    this.sync = sync
    this.uncaught = createUncaughtExceptionHandler(uncaught)
    this.process = process
}

Shuttle.prototype.uncaughtException = function (error) {
    console.error(error.stack)
    this.uncaught.call(null, error)
    this.exit(function () { this.process.exit(1) }.bind(this))
}

Shuttle.prototype.stop = function () {
    this.queue.close()
}

Shuttle.prototype.exit = function (callback) {
    this.stop()
    this.queue.exit(this.sync, callback)
}

Shuttle.shuttle = require('./bootstrap').createShuttle(require('net'), Shuttle)

Shuttle.filename = module.filename

Shuttle.sink = require('prolific.sink')

module.exports = Shuttle
