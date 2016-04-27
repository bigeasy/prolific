var url = require('url')

var Delta = require('delta')
var Reactor = require('reactor')

function Sender (configuration) {
    this._sending = new Reactor({ object: this, method: '_send' })
    this.url = url.parse(configuration.url)
    this.socket = dgram.createSocket('udp4')
}

Sender.prototype.send = function (chunk) {
    this._sending.push(chunk)
}

Sender.prototype._send = cadence(function (async, timeout, chunk) {
    var socket = net.Socket
    var lines = chunk.toString().split('\n')
    lines.pop()
    async.forEach(function (line) {
        this.socket.send(line, this.url.port, this.url.hostname, async())
    })(lines)
})

module.exports = Sender
