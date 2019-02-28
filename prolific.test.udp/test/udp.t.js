require('proof')(1, prove)

function prove (okay, callback) {
    var dgram = require('dgram')

    var delta = require('delta')

    var sink = { process: function () {} }
    // var processor = new Processor({ url: 'udp://127.0.0.1:9898' }, sink)

    var server = dgram.createSocket('udp4')

    var Server = require('../server')
    var server = new Server

    var Destructible = require('destructible')
    var destructible = new Destructible('t/udp.processor.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    cadence(function (async) {
        async(function () {
            server.bind(9898, '127.0.0.1', async())
        }, function () {
            var client = dgram.createSocket('udp4')
            var buffer = Buffer.from('a\nb\n')
            async(function () {
                client.send(buffer, 0, buffer.length, 9898, '127.0.0.1', async())
            }, function () {
                client.close(async())
            })
        }, function (processor) {
            async(function () {
                server.received.wait(async())
            }, function () {
                okay(server.lines, [ 'a', 'b' ], 'sent')
                server.close(async())
            })
        })
    })(destructible.durable('test'))
}
