require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../filter.argv')
    async(function () {
        argv([ '--select', '$.name == "foo"' ], {}, async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.filter/filter.processor',
            parameters: { params: { select: '$.name == "foo"' } },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
