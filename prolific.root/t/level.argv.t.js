require('proof/redux')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../level'), configuration = { levels: [] }
    async(function () {
        argv([{ configuration: configuration }, [ 'INFO', 'TRACE=bigeasy.example' ]], {}, async())
    }, function (result) {
        assert(result, { argv: [], terminal: false }, 'result')
        assert(configuration, {
            levels: [{
                path: '', level: 'INFO'
            }, {
                path: 'bigeasy.example', level: 'TRACE'
            }]
        }, 'configuration')
    })
}
