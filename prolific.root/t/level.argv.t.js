require('proof/redux')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../level/level.argv'), program
    async(function () {
        argv([ 'INFO', 'bigeasy.example=TRACE' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.monitor/level/level.processor',
            parameters: {
                levels:
                  [ { path: '', level: 'INFO' },
                    { path: 'bigeasy.example', level: 'TRACE' } ] },
            argv: [],
            terminal: false
        }, 'configuration')
        program = argv([], { isMainModule: true }, async())
    }, function () {
        assert(program.stdout.read() != null, 'inspect')
    })
}
