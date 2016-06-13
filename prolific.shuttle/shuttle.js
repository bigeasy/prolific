var Queue = require('prolific.queue')
var createUncaughtExceptionHandler = require('./uncaught')
var abend = require('abend')
var Isochronous = require('isochronous')

function Shuttle (input, output, sync, uncaught, interval) {
    this.input = input
    this.output = output
    this.queue = new Queue(output)
    this.stopped = false
    this.exited = false
    this.sync = sync
    this.uncaught = createUncaughtExceptionHandler(uncaught)
// TODO Interval is so dubious, why not just write?
    this.isochronous = new Isochronous({
        operation: { object: this.queue, method: 'flush' },
        interval: interval
    })
    this.isochronous.run(abend)
}

Shuttle.prototype.uncaughtException = function (error) {
    this.uncaught.call(null, error)
    this.exit()
    throw error
}

Shuttle.prototype.stop = function () {
    if (!this.stopped) {
        this.stopped = true
        this.isochronous.stop()
        this.queue.exit(this.sync)
    }
}

Shuttle.prototype.exit = function () {
    this.stop()
    if (!this.exited) {
        this.exited = true
        this.queue.exit(this.sync)
    }
}

Shuttle.shuttle = require('./bootstrap').createShuttle(require('net'), Shuttle)

module.exports = Shuttle
