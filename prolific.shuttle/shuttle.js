var Queue = require('prolific.queue')
var createUncaughtExceptionHandler = require('./uncaught')
var abend = require('abend')

function Shuttle (input, output, sync, uncaught) {
    this.input = input
    this.output = output
    this.queue = new Queue(output, sync)
    this.uncaught = createUncaughtExceptionHandler(uncaught)
}

Shuttle.prototype.uncaughtException = function (error) {
    this.uncaught.call(null, error)
    this.exit()
    throw error
}

Shuttle.prototype.close = function () {
    this.queue.close()
}

Shuttle.prototype.exit = function () {
    this.close()
    this.queue.exit()
}

Shuttle.shuttle = require('./bootstrap').createShuttle(require('net'), Shuttle)

Shuttle.filename = module.filename

Shuttle.sink = require('prolific.sink')

module.exports = Shuttle
