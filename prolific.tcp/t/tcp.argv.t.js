require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../tcp.argv')
    async(function () {
        argv([ '--url', 'tcp://127.0.0.1:514' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.tcp/tcp.processor',
            parameters: { params: { url: 'tcp://127.0.0.1:514' } },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
