var Queue = require('prolific.queue')
var cadence = require('cadence')
var byline = require('byline')
var Delta = require('delta')
var createUncaughtExceptionHandler = require('./uncaught')

function Shuttle (input, output, sync, uncaught) {
    this.input = input
    this.output = output
    this.queue = new Queue
    this.sink = this.queue.createSink(this.output)
    this.stopped = false
    this.sync = sync
    this.uncaught = createUncaughtExceptionHandler(uncaught)
}

Shuttle.prototype.uncaughtException = function (error) {
    this.uncaught.call(null, error)
    this.stop()
    throw error
}

Shuttle.prototype.open = cadence(function (async, configuration) {
    this.queue.write(JSON.stringify(configuration))
    async(function () {
        new Delta(async()).ee(byline(this.input)).on('data')
    }, function (configuration) {
        this.configuration = JSON.parse(configuration)
        this.sink.open(async())
    }, function () {
        this.sink.flush(async())
    })
})

Shuttle.prototype.stop = function () {
    if (!this.stopped) {
        this.stopped = true
        this.queue.exit(this.sync)
    }
}

Shuttle.shuttle = require('./bootstrap').createShuttle(require('net'), Shuttle)

module.exports = Shuttle
