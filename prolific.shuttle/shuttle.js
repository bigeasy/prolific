var Queue = require('prolific.queue')
var prolific = require('prolific')
var logger = prolific.createLogger('prolific.shuttle')
var fs = require('fs')
var abend = require('abend')
var Isochronous = require('isochronous')
var cadence = require('cadence')
var ok = require('assert').ok
var util = require('util')
var byline = require('byline')
var Delta = require('delta')

function openStream (method, fd) {
    if (typeof fd == 'string') {
        fd = +fd
    }
    if (typeof fd == 'number') {
        return fs[method].call(fs, null, { fd: fd, encoding: 'utf8' })
    }
    return fd
}

function Shuttle (input, output, sync, finale) {
    this.output = openStream('createWriteStream', output)
    this.input = byline(openStream('createReadStream', input))
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
        new Delta(async()).ee(this.input).on('data')
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

Shuttle.shuttle = cadence(function (async, program, interval, configuration, finale) {
    ok(arguments.length == 5, 'invalid arguments')
    if (program.env.PROLIFIC_LOGGING_FD == null) {
        return null
    }
    var fd = program.env.PROLIFIC_LOGGING_FD
    var shuttle = new Shuttle(fd, fd, program.stderr, finale)
    async(function () {
        shuttle.open(configuration, async())
    }, function () {
        program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
        program.on('exit', shuttle.stop.bind(shuttle))
        var isochronous = new Isochronous({
            operation: { object: shuttle.sink, method: 'flush' },
            interval: interval,
            unref: true
        })
        program.on('exit', isochronous.stop.bind(isochronous))
        isochronous.run(abend)
        return [ configuration ]
    })
})

module.exports = Shuttle
