require('proof/redux')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../filter.argv')
    var program
    async(function () {
        argv([ '--select', '$.name == "foo"' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.filter/filter.processor',
            parameters: { select: '$.name == "foo"' },
            argv: [],
            terminal: false
        }, 'configuration')
        program = argv([], {
            isMainModule: true
        }, async())
    }, function () {
        assert(program.stdout.read() != null, 'inspect')
    })
}
