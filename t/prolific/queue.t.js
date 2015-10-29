require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var stream = require('stream')
    var Queue = require('../../queue')
    var out = new stream.PassThrough
    var queue = new Queue()
    async(function () {
        queue.write(1)
        queue.write(2)
        queue.write(3)
        queue.flush({ write: function () {} }, function () {})
        queue.flush(out, async())
    }, function () {
        assert(out.read().toString(), '123', 'written')
    })
}
