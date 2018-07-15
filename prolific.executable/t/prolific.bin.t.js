require('proof')(4, require('cadence')(prove))

function prove (async, assert) {
    var prolific = require('..')
    var path = require('path')

    var child = path.join(__dirname, 'program.js')

    var program
    async(function () {
        program = prolific([ 'configure', 'test', '--key', 'value', 'node', child ], async())
    }, function (code) {
        assert(code, 0, 'ran')
        var env = JSON.parse(program.stderr.read().toString())
        var configuration = JSON.parse(env.PROLIFIC_CONFIGURATION)
        assert(configuration.configured, 'configured')
    }, function (code) {
        async(function () {
            program = prolific([ 'configure', 'test', '--key', 'value', 'node', child, '1' ], async())
        }, function (code) {
            assert(code, 0, 'error exit code')
            var env = JSON.parse(program.stderr.read().toString())
            var configuration = JSON.parse(env.PROLIFIC_CONFIGURATION)
            assert(configuration.configured, 'configured')
        })
        async(function () {
            program.ready.wait(async())
        }, function () {
            setTimeout(async(), 1000)
        }, function () {
            program.emit('SIGTERM')
        })
    })
}
