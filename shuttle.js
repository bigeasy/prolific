var Queue = require('./queue')
var logger = require('./prolific').createLogger('prolific.shuttle')
var fs = require('fs')
var sync = require('./sync')
var Isochronous = require('isochronous')
var cadence = require('cadence')

function Shuttle (process, log, interval) {
    this._logout = fs.createWriteStream(null, { fd: +log })
    this.queue = new Queue
    this._sink = this.queue.createSink(this._logout)
    this._stopped = false
    this._isochronous = new Isochronous({
        interval: interval,
        operation: { object: this._sink, method: 'flush' },
        unref: true
    })
    process.on('uncaughtException', function (error) {
        logger.error('uncaught', { stack: error.stack })
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

module.exports = Shuttle
