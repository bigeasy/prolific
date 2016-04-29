require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var Sender = require('..')

    var dgram = require('dgram')

    var sender = new Sender({ url: 'udp://127.0.0.1:9898' })
    var wait

    var server = dgram.createSocket('udp4')

    server.on('message', function (message, remote) {
        assert(message.toString(), 'abc\n', 'sent')
        wait()
    })

    Sender.youHaveGotToBeKiddingMe(function (error) {
        assert(error.message, 'smh', 'shaking my head')
    })(new Error('smh'))

    async(function () {
        server.bind({
            port: 9898,
            address: '127.0.0.1',
            exclusive: true
        }, async())
    }, function () {
        wait = async()
        sender._send(null, new Buffer('abc\n'), async())
    }, function () {
        server.close(async())
    })
}
