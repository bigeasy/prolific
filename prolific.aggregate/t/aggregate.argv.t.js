require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../aggregate.argv')
    async(function () {
        argv([ '--qualified', 'bigeasy.example#request' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.aggregate/aggregate.processor',
            parameters: { params: { qualified: 'bigeasy.example#request' } },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
