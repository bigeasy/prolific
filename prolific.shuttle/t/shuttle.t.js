require('proof/redux')(1, prove)

function prove (assert, callback) {
    var Shuttle = require('../shuttle')
    var stream = require('stream')
    var io = {
        input: new stream.PassThrough,
        output: new stream.PassThrough,
        sync: new stream.PassThrough
    }
    var shuttle = new Shuttle(io.input, io.output, io.sync, function (error) {
        assert(error.message, 'hello', 'uncaught handled')
        callback()
    })
    shuttle.uncaughtException(new Error('hello'))
}
