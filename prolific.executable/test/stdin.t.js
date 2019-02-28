require('proof')(2, require('cadence')(prove))

function prove (async, okay) {
    var stream = require('stream')
    var reader = require('../stdin')(function () {
        okay('done')
    })

    var stdin = new stream.PassThrough
    var consumer = []
    async(function () {
        reader(stdin, consumer, async())
        stdin.write(JSON.stringify({}) + '\n')
        stdin.end(JSON.stringify({ eos: true }) + '\n')
    }, function () {
        okay(consumer, [ {}, { eos: true } ], 'consumer')
    })
}
