require('proof/redux')(2, require('cadence')(prove))

function prove (async, assert) {
    var monitor = require('..')
    var path = require('path')

    var child = path.join(__dirname, 'program.js')

    var program
    async(function () {
        program = monitor([ 'configure', 'test', '--key', 'value', 'node', child ], async())
    }, function (code) {
        assert(code, 0, 'ran')
        var env = JSON.parse(program.stderr.read().toString())
        var configuration = JSON.parse(env.PROLIFIC_CONFIGURATION)
        assert(configuration.configured, 'configured')
    })
}
