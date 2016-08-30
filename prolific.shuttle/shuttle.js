var Queue = require('prolific.queue')
var createUncaughtExceptionHandler = require('./uncaught')
var abend = require('abend')
var Isochronous = require('isochronous')

function Shuttle (input, output, sync, uncaught, interval, _process) {
    this.input = input
    this.output = output
    this.queue = new Queue(output)
    this.sync = sync
    this.uncaught = createUncaughtExceptionHandler(uncaught)
    this.process = _process || process
// TODO Interval is so dubious, why not just write?
    this.isochronous = new Isochronous({
        operation: { object: this.queue, method: 'flush' },
        interval: interval
    })
    this.isochronous.run(abend)
}

Shuttle.prototype.uncaughtException = function (error) {
    console.error(error.stack)
    this.uncaught.call(null, error)
    this.exit(function () { this.process.exit(1) }.bind(this))
}

Shuttle.prototype.stop = function () {
    this.queue.close()
    this.isochronous.stop()
}

Shuttle.prototype.exit = function (callback) {
    this.stop()
    this.queue.exit(this.sync, callback)
}

Shuttle.shuttle = require('./bootstrap').createShuttle(require('net'), Shuttle)

Shuttle.filename = module.filename

Shuttle.sink = require('prolific.sink')

module.exports = Shuttle
