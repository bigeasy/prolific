require('proof/redux')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../aggregate.argv'), program
    async(function () {
        argv([ '--qualified', 'bigeasy.example#request' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.aggregate/aggregate.processor',
            parameters: { qualified: 'bigeasy.example#request' },
            argv: [],
            terminal: false
        }, 'configuration')
        program = argv([ '--qualified', 'bigeasy.example#request' ], {
            isMainModule: true
        }, async())
    }, function () {
        assert(program.stdout.read() != null, 'inspect')
    })
}
