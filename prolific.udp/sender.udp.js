var dgram = require('dgram')
var url = require('url')

var cadence = require('cadence')
var Reactor = require('reactor')

function Sender (configuration) {
    this._sending = new Reactor({ object: this, method: '_send' })
    this.url = url.parse(configuration.url)
}

Sender.prototype.send = function (chunk) {
    this._sending.push(chunk)
}

Sender.prototype._send = cadence(function (async, timeout, chunk) {
    var lines = chunk.toString().split('\n')
    lines.pop()
    async.forEach(function (line) {
        var client = dgram.createSocket('udp4')
        async(function () {
            var buffer = new Buffer(line + '\n')
            client.send(buffer, 0, buffer.length, this.url.port, this.url.hostname, Sender.youHaveGotToBeKiddingMe(async()))
        }, function () {
            client.close(async())
        })
    })(lines)
})

Sender.youHaveGotToBeKiddingMe = function (callback) {
    return function (error) {
        if (error) callback(error)
        else callback()
    }
}

module.exports = Sender
