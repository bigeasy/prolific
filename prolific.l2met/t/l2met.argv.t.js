require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../l2met.argv'), program
    async(function () {
        argv([], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.l2met/l2met.processor',
            parameters: {},
            argv: [],
            terminal: false
        }, 'configuration terminal')
    })
}
