require('proof/redux')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../file.argv'), program
    async(function () {
        argv([ '--file', 'a' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.file/file.processor',
            parameters: { params: { file: 'a' } },
            argv: [],
            terminal: false
        }, 'configuration')
        program = argv([ '--file', 'a' ], {
            isMainModule: true
        }, async())
    }, function () {
        assert(program.stdout.read() != null, 'inspect')
    })
}
