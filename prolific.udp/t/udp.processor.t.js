require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../udp.processor')

    var dgram = require('dgram')

    var delta = require('delta')

    var sink = { process: function () {} }
    // var processor = new Processor({ url: 'udp://127.0.0.1:9898' }, sink)

    var server = dgram.createSocket('udp4')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/udp.processor.t')

    destructible.completed.wait(async())

    async([function () {
        destructible.destroy()
    }], function () {
        server.bind(9898, '127.0.0.1', async())
    }, function () {
        destructible.monitor('UDP', Processor, {
            url: 'udp://127.0.0.1:9898'
        }, sink, async())
    }, function (processor) {
        async(function () {
            var wait = async()
            server.once('message', function (message, remote) {
                assert(message.toString(), '{"a":1}\n', 'sent')
                wait()
            })
            processor.send({ hostname: '127.0.0.1', port: 9898 }, JSON.stringify({ a: 1 }) + '\n')
        }, function () {
            delta(async()).ee(server).on('close')
            server.close()
        })
    })
}
