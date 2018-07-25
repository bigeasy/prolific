var dgram = require('dgram')
var url = require('url')

var stringify = require('prolific.stringify')
var delta = require('delta')
var cadence = require('cadence')
var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Evaluator = require('prolific.evaluator')

var host = require('./host')

var youHaveGotToBeKiddingMe = require('./error')

function Processor (turnstile, parameters, nextProcessor) {
    this._queue = new Turnstile.Queue(this, '_process', turnstile)
    if (parameters.url != null) {
        var parsed = host(parameters.url)
        this._select = function () { return parsed }
    } else {
        var select = Evaluator.create(parameters.select)
        this._select = function (entry) { return host(select(entry)) }
    }
    this._nextProcessor = nextProcessor
}

Processor.prototype.process = function (entry) {
    var server = this._select.call(null, entry)
    if (server != null) {
        this._queue.push({
            server: server,
            stringified: stringify(entry)
        })
    }
    this._nextProcessor.process(entry)
}

Processor.prototype._process = cadence(function (async, envelope) {
    var client = dgram.createSocket('udp4')
    var body = envelope.body
    async(function () {
        var buffer = Buffer.from(body.stringified)
        var server = body.server
        client.send(buffer, 0, buffer.length, server.port, server.hostname, youHaveGotToBeKiddingMe(async()))
    }, function () {
// ACHTUNG Node.js 0.10 does not accept a callback to `close()`, you must set a handler.
        delta(async()).ee(client).on('close')
        client.close()
    })
})

module.exports = cadence(function (async, destructible, configuration, nextProcessor) {
    var turnstile = new Turnstile
    // TODO We're probably doing this wrong. We don't want to just stop the
    // turnstile, we want to wait for it to empty.
    /*
    destructible.destruct.wait(turnstile, 'close')
    turnstile.listen(destructible.monitor('turnstile'))
     */
    return [ new Processor(turnstile, configuration, nextProcessor) ]
})

module.exports.isProlificProcessor = true
