require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../level'), configuration = { levels: [] }
    async(function () {
        argv(['INFO', 'TRACE=example' ], {}, configuration, async())
    }, function (result) {
        assert(result, { argv: [], terminal: false }, 'result')
        assert(configuration, {
            levels: [{
                path: '', level: 'INFO'
            }, {
                path: 'example', level: 'TRACE'
            }]
        }, 'configuration')
    })
}
