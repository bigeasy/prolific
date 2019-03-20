require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var stream = require('stream')
    var Collector = require('prolific.collector')
    var collect = require('../collect')
    var input = new stream.PassThrough
    var output = new stream.PassThrough
    var outbox = []
    var collector = new Collector(output, outbox)
    async(function () {
        collect(collector, input, async())
        input.end('error\n')
    }, function () {
        okay(output.read().toString(), 'error\n', 'collected')
    })
}
