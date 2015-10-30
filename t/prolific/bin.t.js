require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var bin = require('../../prolific.bin'), io
    var dgram = require('dgram')
    var Delta = require('delta')
    var udp = dgram.createSocket('udp4')
    var lines = []
    async(function () {
        udp.on('message', function (message) {
            lines.push(message.toString())
        })
        udp.bind(8514, async())
    }, function () {
        io = bin({}, [
            '--udp', '127.0.0.1:8514', 'node', 't/prolific/service.bin.js', '--log', '3'
        ], {}, async())
    }, function () {
        assert(/^<(\d+)>/.exec(lines[0])[1], '129', 'info')
        assert(/^<(\d+)>/.exec(lines[1])[1], '132', 'error')
        lines.length = 0
    }, function () {
        async(function () {
            io = bin({}, [
                '--udp', '127.0.0.1:8514', 'node', 't/prolific/sleep.bin.js'
            ], {}, async())
            async(function () {
                setTimeout(async(), 250)
            }, function () {
                io.events.emit('SIGINT')
            })
        }, function () {
            io.events.emit('SIGINT')
        })
    }, function () {
        new Delta(async()).ee(udp).on('close')
        udp.close()
    })
}
