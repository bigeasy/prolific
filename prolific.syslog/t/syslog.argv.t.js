require('proof/redux')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../syslog.argv'), program
    async(function () {
        argv([ '--application', 'a' ], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.syslog/syslog.processor',
            parameters: { application: 'a' },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
