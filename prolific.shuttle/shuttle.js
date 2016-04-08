var Queue = require('prolific.queue')
var prolific = require('prolific')
var logger = prolific.createLogger('prolific.shuttle')
var fs = require('fs')
var abend = require('abend')
var Isochronous = require('isochronous')
var cadence = require('cadence')
var ok = require('assert').ok

function Shuttle (process, log, interval) {
    this._logout = fs.createWriteStream(null, { fd: +log })
    prolific.sink = this.queue = new Queue
    this._sink = this.queue.createSink(this._logout)
    this._stopped = false
    this._isochronous = new Isochronous({
        interval: interval,
        operation: { object: this._sink, method: 'flush' },
        unref: true
    })
    process.on('uncaughtException', function (error) {
        logger.error('uncaught', { stack: error.stack })
        if (error.cause) {
            console.log(error.cause.stack)
            logger.error('uncaught.cause', { stack: error.cause.stack })
        }
        this.stop()
        throw error
    }.bind(this))
    process.on('exit', this.stop.bind(this))
    this._stderr = process.stderr
}

Shuttle.prototype.run = cadence(function (async) {
    async(function () {
        this._sink.open(async())
    }, function () {
        this._isochronous.run(async())
    })
})

Shuttle.prototype.stop = function () {
    if (!this._stopped) {
        this._stopped = true
        this._isochronous.stop()
        this.queue.exit(this._stderr)
    }
}

Shuttle.shuttle = function (program, interval) {
    ok(interval, 'interval required')
    if (!program.env.PROLIFIC_LOGGING_FD) {
        return
    }
    var shuttle = new Shuttle(program, +program.env.PROLIFIC_LOGGING_FD, interval)
    shuttle.run(abend)
    return shuttle
}

module.exports = Shuttle
