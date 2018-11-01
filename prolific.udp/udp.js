var dgram = require('dgram')
var url = require('url')

var cadence = require('cadence')
var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Evaluator = require('prolific.evaluator')

var youHaveGotToBeKiddingMe = require('./error')

function Processor (turnstile) {
    this._queue = new Turnstile.Queue(this, '_process', turnstile)
}

Processor.prototype.send = function (to, line) {
    this._queue.push({ to: to, line: line })
}

Processor.prototype._process = cadence(function (async, envelope) {
    var client = dgram.createSocket('udp4')
    var buffer = Buffer.from(envelope.body.line), to = envelope.body.to
    async(function () {
        client.send(buffer, 0, buffer.length, to.port, to.hostname, youHaveGotToBeKiddingMe(async()))
    }, function () {
        client.close(async())
    })
})

module.exports = cadence(function (async, destructible, configuration) {
    var turnstile = new Turnstile
    // TODO We're probably doing this wrong. We don't want to just stop the
    // turnstile, we want to wait for it to empty.
    /*
    destructible.destruct.wait(turnstile, 'close')
    turnstile.listen(destructible.monitor('turnstile'))
     */
    return [ new Processor(turnstile) ]
})
