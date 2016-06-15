require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../syslog.argv')
    async(function () {
        argv([ '--application', 'a' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.syslog/syslog.processor',
            parameters: { params: { application: 'a' } },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
