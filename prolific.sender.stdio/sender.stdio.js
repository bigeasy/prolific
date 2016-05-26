var cadence = require('cadence')
var url = require('url')
var assert = require('assert')

function Sender (configuration) {
    var parsed = url.parse(configuration.url)
    assert(parsed.host == 'stderr' || parsed.host == 'stdout')
    this._streamName = parsed.host
}

Sender.prototype.send = function (chunk) {
    process[this._streamName].write(chunk)
}

Sender.prototype.close = function (callback) { callback() }

module.exports = Sender
