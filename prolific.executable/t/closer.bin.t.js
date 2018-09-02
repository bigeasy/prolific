require('proof')(3, require('cadence')(prove))

function prove (async, okay) {
    var prolific = require('../closer.bin')
    var path = require('path')

    var child = path.join(__dirname, 'program.js')

    var stream = require('stream')
    var program
    async(function () {
        program = prolific([ 'node', child ], async())
    }, function (code) {
        okay(code, 0, 'ran')
        var lines = program.stderr.read().toString().split('\n')
        okay(lines[0], '% closer 0 aaaaaaaa 811c9dc5 1', 'header')
        okay(JSON.parse(lines[2]).path[0], process.pid, 'path')
    })
}
