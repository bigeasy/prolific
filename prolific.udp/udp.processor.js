var dgram = require('dgram')
var url = require('url')

var cadence = require('cadence')
var Reactor = require('reactor')

function Processor (parameters) {
    this._processing = new Reactor({ object: this, method: '_process' })
    this.url = url.parse(parameters.params.url)
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    this._processing.push(entry.formatted || JSON.stringify(entry) + '\n')
}

Processor.prototype._process = cadence(function (async, timeout, line) {
    var client = dgram.createSocket('udp4')
    async(function () {
        var buffer = new Buffer(line)
        client.send(buffer, 0, buffer.length, this.url.port, this.url.hostname, Processor.youHaveGotToBeKiddingMe(async()))
    }, function () {
        client.close(async())
    })
})

Processor.youHaveGotToBeKiddingMe = function (callback) {
    return function (error) {
        if (error) callback(error)
        else callback()
    }
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
