require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var stream = require('stream')
    var abend = require('abend')
    var Queue = require('../../queue')
    var fail, out = {
        write: function (buffer, callback) {
            if (!fail) {
                this.stream.write(buffer, callback)
            }
        },
        stream: new stream.PassThrough
    }
    var queue = new Queue()
    var sink = queue.createSink(out)
    async(function () {
        queue.write(1 + '\n')
        queue.write(2 + '\n')
        queue.write(3 + '\n')
        sink.open(async())
    }, function () {
        sink.flush(out, async())
    }, function () {
        sink.flush(out, async())
    }, function () {
        assert(out.stream.read().toString(), '2863311530 2129253025 11\n2863311530\n2863311530 4256134199 6\n1\n2\n3\n', 'written')
    }, function () {
        queue.write(4 + '\n')
        fail = true
        sink.flush(out, abend)
    }, function () {
        var sink = queue.createSink(new stream.PassThrough)
        async(function () {
            sink.open(async())
        }, function () {
            sink.flush(out, async())
        })
    }, function () {
        sink.flush(out, async())
    })
}
