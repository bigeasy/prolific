require('proof')(1, prove)

function prove (assert) {
    var Shuttle = require('../shuttle')
    var stream = require('stream')
    var io = {
        input: new stream.PassThrough,
        output: new stream.PassThrough,
        sync: new stream.PassThrough
    }
    try {
        var shuttle = new Shuttle(io.input, io.output, io.sync, function (error) {
            assert(error.message, 'hello', 'uncaught handled')
        })
        shuttle.uncaughtException(new Error('hello'))
    } catch (e) {
        shuttle.stop()
    }
}
