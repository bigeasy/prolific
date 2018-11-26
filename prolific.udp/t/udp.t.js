require('proof')(1, prove)

function prove (okay, callback) {
    var Processor = require('..')

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
            destructible.monitor('UDP', Processor, {
                url: 'udp://127.0.0.1:9898'
            }, sink, async())
        }, function (processor) {
            async(function () {
                server.received.wait(async())
                processor.send({ hostname: '127.0.0.1', port: 9898 }, JSON.stringify({ a: 1 }) + '\n')
            }, function () {
                okay(server.lines, [ '{"a":1}' ], 'sent')
                server.close(async())
            }, function () {
                destructible.destroy()
                processor.send({ hostname: '127.0.0.1', port: 9898 }, JSON.stringify({ a: 1 }) + '\n')
            })
        })
    })(destructible.monitor('test'))
}
