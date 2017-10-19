var dgram = require('dgram')
var url = require('url')

var stringify = require('prolific.stringify')
var delta = require('delta')
var cadence = require('cadence')
var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Evaluator = require('prolific.evaluator')

var host = require('./host')

function Processor (parameters, next) {
    this._processing = new Turnstile.Queue(this, '_process', new Turnstile)
    if (parameters.url != null) {
        var parsed = host(parameters.url)
        this._select = function () { return parsed }
    } else {
        var select = Evaluator.create(parameters.select)
        this._select = function (entry) { return host(select(entry)) }
    }
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    var server = this._select.call(null, entry)
    if (server != null) {
        this._processing.push({
            server: server,
            stringified: stringify(entry)
        })
    }
    this._next.process(entry)
}

Processor.prototype._process = cadence(function (async, envelope) {
    var client = dgram.createSocket('udp4')
    var body = envelope.body
    async(function () {
        var buffer = new Buffer(body.stringified)
        var server = body.server
        client.send(buffer, 0, buffer.length, server.port, server.hostname, Processor.youHaveGotToBeKiddingMe(async()))
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
