require('proof')(4, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../udp.processor')

    var dgram = require('dgram')

    var delta = require('delta')

    var sink = { process: function () {} }
    var processor = new Processor({ url: 'udp://127.0.0.1:9898' }, sink)

    var server = dgram.createSocket('udp4')

    Processor.youHaveGotToBeKiddingMe(function (error) {
        assert(error.message, 'smh', 'shaking my head')
    })(new Error('smh'))

    async(function () {
        processor.open(async())
    }, function () {
        server.bind(9898, '127.0.0.1', async())
    }, function () {
        var wait = async()
        server.once('message', function (message, remote) {
            assert(message.toString(), '{"a":1}\n', 'sent')
            wait()
        })
        processor.process({ formatted: [], json: { a: 1 } })
    }, function () {
        var wait = async()
        server.once('message', function (message, remote) {
            assert(message.toString(), 'foo\n', 'sent formatted')
            wait()
        })
        processor.process({ formatted: [ 'foo\n' ] })
    }, function () {
        processor.close(async())
    }, function () {
        processor = new Processor({ select: '$.host' }, sink)
        processor.open(async())
    }, function () {
        var wait = async()
        server.once('message', function (message, remote) {
            assert(message.toString(), '{"host":"127.0.0.1:9898"}\n', 'sent selected')
            wait()
        })
        processor.process({ formatted: [], json: { a: 1 } })
        processor.process({ formatted: [], json: { host: '127.0.0.1:9898' } })
    }, function () {
        processor.close(async())
    }, function () {
        delta(async()).ee(server).on('close')
        server.close()
    })
}
