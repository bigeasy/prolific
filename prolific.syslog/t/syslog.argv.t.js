require('proof/redux')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../syslog.argv'), program
    async(function () {
        argv([ '--application', 'a' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.syslog/syslog.processor',
            parameters: { params: { application: 'a' } },
            argv: [],
            terminal: false
        }, 'configuration')
        program = argv([], { isMainModule: true }, async())
    }, function () {
        assert(program.stdout.read() != null, 'inspect')
    })
}
