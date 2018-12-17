require('proof')(2, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/tcp.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var TCP = require('../tcp')

    var Server = require('prolific.test.tcp')
    var server = new Server
    var delta = require('delta')

    cadence(function (async) {
        async(function () {
            server.server.listen(8086)
            delta(async()).ee(server.server).on('listening')
        }, function () {
            destructible.durable('tcp', TCP, {
                url: 'tcp://127.0.0.1:8086',
                rotate: 5
            }, async())
        }, function (tcp) {
            async(function () {
                server.received.wait(async())
                tcp.send('x\n')
            }, function () {
                okay(server.lines.splice(0), [ 'x' ], 'sent')
                server.received.wait(async())
                tcp.send('abcdefg\n')
            }, function () {
                setImmediate(async())
            }, function () {
                okay({
                    lines: server.lines.splice(0),
                    written: tcp.written
                }, {
                    lines: [ 'abcdefg' ],
                    written: 0
                }, 'rotated')
                delta(async()).ee(server.server).on('close')
                server.server.close()
            }, function () {
                tcp.send('abcdefg\n')
            }, function () {
                tcp.destroy()
                tcp.send('abcdefg\n')
            })
        })
    })(destructible.durable('test'))
}
