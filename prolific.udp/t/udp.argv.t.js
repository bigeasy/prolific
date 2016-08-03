require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../udp.argv'), program
    async(function () {
        argv([ '--url', 'udp://127.0.0.1:514' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.udp/udp.processor',
            parameters: { params: { url: 'udp://127.0.0.1:514' } },
            argv: [],
            terminal: false
        }, 'configuration')
        program = argv([ '--url', 'udp://127.0.0.1:514' ], {
            isMainModule: true
        }, async())
    }, function () {
        assert(program.stdout.read() != null, 'inspect')
    })
}
