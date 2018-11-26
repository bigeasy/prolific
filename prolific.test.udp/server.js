var dgram = require('dgram')
var cadence = require('cadence')
var Signal = require('signal')
var Splitter = require('./splitter')

function Server () {
    var lines = this.lines = []
    var received = this.received = new Signal
    this._server = dgram.createSocket('udp4')
    this._server.on('message', function (message) {
        Array.prototype.push.apply(lines, Splitter(message.toString()))
        received.notify()
    })
}

Server.prototype.bind = cadence(function (async, port, iface) {
    this._server.bind(port, iface, async())
})

Server.prototype.close = function (callback) {
    this._server.close(callback)
}

module.exports = Server
