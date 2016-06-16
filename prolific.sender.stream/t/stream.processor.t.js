require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var Sender = require('..')
    var stream = require('stream')

    var wait = async()
    var out = new stream.PassThrough
    var sender = new Sender(out)
    async(function () {
        sender.process({ formatted: 'foo\n' })
        sender.splice(['{"a":1}\n'])
        var expected = [
            { name: 'processed', value: 'foo\n' },
            { name: 'spliced', value: '{"a":1}\n' }
        ]
        out.on('data', function (data) {
            var expect = expected.shift()
            assert(data.toString(), expect.value, expect.name)
            if (expected.length == 0) {
                wait()
            }
        })
    }, function () {
        sender.flush(async())
    })
}
