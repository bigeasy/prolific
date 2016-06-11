require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../stdio.argv')
    async(function () {
        argv([ '--stderr' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.stdio/stdio.sender',
            params: { stderr: true },
            terminal: false
        }, 'configuration')
    })
}
