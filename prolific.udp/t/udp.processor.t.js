require('proof/redux')(3, require('cadence')(prove))

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
        processor.process({ json: { a: 1 } })
    }, function () {
        var wait = async()
        server.once('message', function (message, remote) {
            assert(message.toString(), 'foo\n', 'sent formatted')
            wait()
        })
        processor.process({ formatted: 'foo\n' })
    }, function () {
        processor.close(async())
        delta(async()).ee(server).on('close')
        server.close()
    })
}
