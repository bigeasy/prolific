var net = require('net')

var Signal = require('signal')

var cadence = require('cadence')
var abend = require('abend')

var byline = require('byline')
var Staccato = require('staccato')

var destroyer = require('server-destroy')

function Server (options) {
    var lines = this.lines = []
    var received = this.received = new Signal

    var split = cadence(function (async, socket) {
        var staccato = new Staccato.Readable(byline(socket))
        async.loop([], function () {
            async(function () {
                staccato.read(async())
            }, function (line) {
                if (line == null) {
                    return [ async.break ]
                }
                lines.push(line.toString())
                received.notify()
            })
        })
    })

    this.server = net.createServer(function (socket) { split(socket, abend) })
    destroyer(this.server)
}

module.exports = Server
