var cadence = require('cadence')
var logger = require('./prolific').createLogger('bigeasy.prolific.sender.tcp')
var Reactor = require('reactor')

function Sender (host, port, sync) {
    this._sending = new Reactor({ object: this, method: '_send' })
    this._host = host
    this._port = port
    this._sync = sync
}

// TODO The primary concern at the time of writing is capturing fatal errors
// which are lost by the common logging methods. We're not interested in
// preserving all logging messages for everyone forever. A break in the logging
// stream between the monitor and monitored process is unlikely and indicative
// of serious faults with the host well beyond the scope of an application. The
// checksums there exist to allow the monitor to stitch in a final message
// written to standard error, not to verify the integrity of the logging stream.
//
// Here we once again face a problem. How do we want to handle framing and
// integrity? How do we want to handle retransmissions? How do we know that a
// message was indeed transmitted, accepted?
//
// TCP will guarantee transmission, but I'd need to develop a protocol of sorts
// to do framing and acknowledgement. HTTP is always there, is easy to
// understand, has framing and acknowledgement, it always does the right thing.
//
// Perhaps, for now, the right thing is to simply ship the TCP to an end point,
// since the solution for finding problems is going to be to scan the stream for
// health messages, looking for processes that are becoming unhealthy, or
// processes that have gone missing. Yet, why surrender the framing? Why not
// recover from faults. We can allow the end point to restart. We can assume
// that a 200 error means we've made it to the next queue and delete our copy.
//
// Then we can can go so far as to put Paxos on the other line and be absolutely
// certain we've captured the message, which in turn makes me once again wonder
// if it is really worth it. It seems that I'm close to building a reliable
// logging stream here, so that if we create a reliable logging stream, we might
// in turn come to depend on it, but if it is reliable we never will.
Sender.prototype.send = function (chunk) {
    this._sending.push(chunk)
}

var Delta = require('delta')
var net = require('net')

Sender.prototype._send = cadence(function (async, timeout, chunk) {
    var socket = new net.Socket
    async([function () {
        socket.destroy()
    }], [function () {
        async(function () {
            socket.connect({ port: this._port, host: this._host })
            new Delta(async()).ee(socket).on('connect')
        }, function () {
            socket.end(chunk)
            new Delta(async()).ee(socket).on('close')
        })
    }, function (error) {
        logger.error('write', { stack: error.stack })
        this._sync.write(chunk)
    }])
})

Sender.prototype.close = cadence(function () {
    return []
})

module.exports = Sender
