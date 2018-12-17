require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Server = require('..')
    var server = new Server
    var delta = require('delta')
    var net = require('net')
    async(function () {
        delta(async()).ee(server.server).on('listening')
        server.server.listen(8514, '127.0.0.1')
    }, function () {
        var socket = net.connect(8514, '127.0.0.1')
        async(function () {
            delta(async()).ee(socket).on('connect')
        }, function () {
            socket.write('x\n')
            server.received.wait(async())
        }, function () {
            okay(server.lines, [ 'x' ], 'line')
            console.log('started', server.lines)
            socket.end(async())
        }, function () {
            server.server.close()
        })
    })
}
