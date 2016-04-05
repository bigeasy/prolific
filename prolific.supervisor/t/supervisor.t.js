require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var supervisor = require('../supervisor')

    var io
    async(function () {
        io = supervisor({}, [ 'test', 'a' ], {}, async())
    }, function (code) {
        assert(code, 0, 'code')
    })
}
