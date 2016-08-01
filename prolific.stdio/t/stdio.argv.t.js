require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../stdio.argv'), program
    async(function () {
        argv([ '--stderr' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.stdio/stdio.processor',
            parameters: { params: { stderr: true } },
            argv: [],
            terminal: false
        }, 'configuration')
        program = argv([ '--stderr' ], {
            isMainModule: true
        }, async())
    }, function () {
        assert(program.stdout.read() != null, 'inspect')
    })
}
