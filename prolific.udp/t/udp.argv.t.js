require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../udp.argv')
    async(function () {
        argv([ '--url', 'udp://127.0.0.1:514' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.udp/udp.processor',
            parameters: { params: { url: 'udp://127.0.0.1:514' } },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
