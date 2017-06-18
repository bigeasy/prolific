require('proof')(4, require('cadence')(prove))

function prove (async, assert) {
    var monitor = require('..')
    var path = require('path')

    var child = path.join(__dirname, 'program.js')
    var expectedExitCode = /^v0\.10\./.test(process.version) ? 143 : 0

    var program
    async(function () {
        program = monitor([ 'configure', 'test', '--key', 'value', 'node', child ], async())
    }, function (code) {
        assert(code, expectedExitCode, 'ran')
        var env = JSON.parse(program.stderr.read().toString())
        var configuration = JSON.parse(env.PROLIFIC_CONFIGURATION)
        assert(configuration.configured, 'configured')
    }, function () {
        program = monitor([ '--siblings', 'configure', 'test', '--key', 'value', 'node', child ], async())
    }, function (code) {
        assert(code, 0, 'ran')
        var env = JSON.parse(program.stderr.read().toString())
        var configuration = JSON.parse(env.PROLIFIC_CONFIGURATION)
        assert(configuration.configured, 'configured')
    })
}
