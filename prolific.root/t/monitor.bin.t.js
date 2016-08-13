require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var monitor = require('../monitor.bin')
    var path = require('path')

    var program = path.join(__dirname, 'program.js')

    var io
    async(function () {
        program = monitor([ 'test', '--key', 'value', 'node', program ], {}, async())
        program.emit('SIGTERM')
    }, function () {
        assert(true, 'ran')
    })
}
