var Queue = require('prolific.queue')
var prolific = require('prolific')
var logger = prolific.createLogger('prolific.shuttle')
var fs = require('fs')
var net = require('net')
var abend = require('abend')
var Isochronous = require('isochronous')
var cadence = require('cadence')
var ok = require('assert').ok
var util = require('util')
var byline = require('byline')
var Delta = require('delta')

function Shuttle (input, output, sync, finale) {
    ok(arguments.length == 4)
    this.input = input
    this.output = output
    this.queue = new Queue
    this.sink = this.queue.createSink(this.output)
    this.stopped = false
    this.sync = sync
    this.finale = finale
}

Shuttle.prototype.uncaughtException = function (error) {
    this.finale.call(null, error)
    this.stop()
    throw error
}

Shuttle.prototype.open = cadence(function (async, configuration) {
    ok(configuration, 'configuration required')
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
