require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../file.argv'), program
    async(function () {
        argv([ '--file', 'a' ], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.file/file.processor',
            parameters: { file: 'a' },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
