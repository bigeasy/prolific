require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var bin = require('../prolific.bin')

    var io
    async(function () {
        io = bin({}, [ 'test', 'a' ], {}, async())
    }, function (code) {
        assert(code, 0, 'code')
    })
}
