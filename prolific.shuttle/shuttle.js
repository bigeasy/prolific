var Queue = require('prolific.queue')
var createUncaughtExceptionHandler = require('./uncaught')
var abend = require('abend')
var assert = require('assert')

function Shuttle (pid, input, output, sync, uncaught) {
    assert(arguments.length == 5)
    this.input = input
    this.output = output
    this.queue = new Queue(pid, output, sync)
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
