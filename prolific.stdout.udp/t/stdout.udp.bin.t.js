require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var monitor = require('../stdout.udp.bin')
    var path = require('path')

    var sender = path.join(__dirname, 'sender.js')
    var program = path.join(__dirname, 'program.js')
    var dgram = require('dgram')

    var io
    async(function () {
        io = monitor({}, [ '--port', 8514 ], {}, async())
        async(function () {
            setTimeout(async(), 100)
        }, function () {
            var socket = dgram.createSocket('udp4')
            async(function () {
                var callback = async()
                socket.send(new Buffer('x\n'), 0, 2, 8514, '127.0.0.1', function (error) {
                    if (error) callback(error)
                    else callback()
                })
            }, function () {
                setTimeout(async(), 100)
            }, function () {
                socket.close(async())
            })
        }, function () {
            io.events.emit('SIGINT')
        })
    }, function (code) {
        assert(code, 0, 'code')
        assert(io.stdout.read().toString(), 'x\n', 'stdout')
    })
}
