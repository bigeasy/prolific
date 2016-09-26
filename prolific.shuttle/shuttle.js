var Queue = require('prolific.queue')
var createUncaughtExceptionHandler = require('./uncaught')
var abend = require('abend')

function Shuttle (input, output, sync, uncaught, process) {
    this.input = input
    this.output = output
    this.queue = new Queue(output, sync)
    this.uncaught = createUncaughtExceptionHandler(uncaught)
    this.process = process
}

Shuttle.prototype.uncaughtException = function (error) {
    console.error(error.stack)
    this.uncaught.call(null, error)
    this.exit(this.process.exit.bind(this.process, 1))
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
