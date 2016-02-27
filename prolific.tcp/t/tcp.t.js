require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var tcp = require('../prolific.tcp.bin')
    var path = require('path')
    var worker = path.join(__dirname, 'worker.js')
    async(function () {
        var io = tcp({}, [ '--log', '127.0.0.1:8088', 'node', worker ], {}, async())
        async(function () {
            setTimeout(async(), 250)
        }, function () {
            io.events.emit('SIGINT')
        })
    }, function (code) {
        assert(code, 0, 'exit')
    })
}
