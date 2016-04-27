require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var monitor = require('../monitor.bin')
    var path = require('path')

    var sender = path.join(__dirname, 'sender.js')
    var program = path.join(__dirname, 'program.js')

    var io
    async(function () {
        io = monitor({}, [ '--url', 'test://127.0.0.1', 'node', sender, 'node', program ], {}, async())

        io.events.emit('SIGTERM')
    }, function (code) {
        assert(code, 0, 'code')
    })
}
