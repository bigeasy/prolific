require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var Sender = require('..')
    var stream = require('stream')

    async(function () {
        var out = new stream.PassThrough
        var sender = new Sender(out, true)
        async(function () {
            sender.send({ buffer: new Buffer('a\n') })
            sender.close(async())
        }, function () {
            assert(out.read().toString(), 'a\n', 'closed')
        })
    }, function () {
        var out = new stream.PassThrough
        var sender = new Sender(out, false)
        async(function () {
            sender.send({ buffer: new Buffer('a\n') })
            sender.close(async())
        }, function () {
            assert(out.read().toString(), 'a\n', 'closed')
        })
    })
}
