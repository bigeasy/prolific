var Queue = require('prolific.queue')
var createUncaughtExceptionHandler = require('./uncaught')
var abend = require('abend')
var assert = require('assert')

function Shuttle (pid, sync, uncaught, descendent) {
    this.queue = new Queue(pid, sync)
    this.uncaught = createUncaughtExceptionHandler(uncaught)
    this._descendent = descendent
}

Shuttle.prototype.uncaughtException = function (error) {
    this.uncaught.call(null, error)
    this.exit()
    throw error
}

Shuttle.prototype.close = function () {
    this._descendent.destroy()
    this.queue.close()
}

Shuttle.prototype.exit = function () {
    this.close()
    this.queue.exit()
}

Shuttle.prototype.setPipe = function (input, output) {
    this.queue.setPipe(output)
}

Shuttle.shuttle = require('./bootstrap').createShuttle(require('net'), Shuttle, Date)

Shuttle.filename = module.filename

Shuttle.sink = require('prolific.sink')

module.exports = Shuttle
