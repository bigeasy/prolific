require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../file.argv')
    async(function () {
        argv([ '--file', 'a' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.file/file.processor',
            parameters: { params: { file: 'a' } },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
