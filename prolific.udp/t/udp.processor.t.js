require('proof')(3, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../udp.processor')

    var dgram = require('dgram')

    var sink = { process: function () {} }
    var processor = new Processor({ params: { url: 'udp://127.0.0.1:9898' } }, sink)

    var server = dgram.createSocket('udp4')

    Processor.youHaveGotToBeKiddingMe(function (error) {
        assert(error.message, 'smh', 'shaking my head')
    })(new Error('smh'))

    async(function () {
        processor.open(async())
    }, function () {
        server.bind({
            port: 9898,
            address: '127.0.0.1',
            exclusive: true
        }, async())
    }, function () {
        var wait = async()
        server.once('message', function (message, remote) {
            assert(message.toString(), '{"a":1}\n', 'sent')
            wait()
        })
        processor.process({ a: 1 })
    }, function () {
        var wait = async()
        server.once('message', function (message, remote) {
            assert(message.toString(), 'foo\n', 'sent formatted')
            wait()
        })
        processor.process({ formatted: 'foo\n' })
    }, function () {
        processor.close(async())
        server.close(async())
    })
}
