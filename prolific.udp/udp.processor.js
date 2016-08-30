var dgram = require('dgram')
var url = require('url')

var stringify = require('prolific/stringify')
var delta = require('delta')
var cadence = require('cadence')
var Reactor = require('reactor')

function Processor (parameters, next) {
    this._processing = new Reactor({ object: this, method: '_process' })
    this.url = url.parse(parameters.params.url)
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    this._processing.push(stringify(entry))
    this._next.process(entry)
}

Processor.prototype._process = cadence(function (async, timeout, line) {
    var client = dgram.createSocket('udp4')
    async(function () {
        var buffer = new Buffer(line)
        client.send(buffer, 0, buffer.length, this.url.port, this.url.hostname, Processor.youHaveGotToBeKiddingMe(async()))
    }, function () {
// ACHTUNG Node.js 0.10 does not accept a callback to `close()`, you must set a handler.
        delta(async()).ee(client).on('close')
        client.close()
    })
})

var count = 0

Processor.youHaveGotToBeKiddingMe = function (callback) {
    return function (error) {
        if (error) callback(error)
        else callback()
    }
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
