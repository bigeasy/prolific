var Queue = require('prolific.queue')
var createUncaughtExceptionHandler = require('./uncaught')

function Shuttle (input, output, sync, uncaught) {
    this.input = input
    this.output = output
    this.queue = new Queue
    this.stopped = false
    this.sync = sync
    this.uncaught = createUncaughtExceptionHandler(uncaught)
}

Shuttle.prototype.uncaughtException = function (error) {
    this.uncaught.call(null, error)
    this.stop()
    throw error
}

Shuttle.prototype.stop = function () {
    if (!this.stopped) {
        this.stopped = true
        this.queue.exit(this.sync)
    }
}

Shuttle.shuttle = require('./bootstrap').createShuttle(require('net'), Shuttle)

module.exports = Shuttle
