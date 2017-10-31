require('proof')(2, prove)

function prove (assert) {
    var Shuttle = require('../shuttle')
    var stream = require('stream')
    var io = {
        input: new stream.PassThrough,
        output: new stream.PassThrough,
        sync: new stream.PassThrough
    }
    var shuttle = new Shuttle(1, io.sync, function (error) {
        assert(error.message, 'hello', 'uncaught handled')
    })
    try {
        shuttle.uncaughtException(new Error('hello'))
    } catch (error) {
        console.log(error.stack)
        assert(error.message, 'hello', 'thrown')
    }
    var pipe = new stream.PassThrough
    shuttle.setPipe(pipe, pipe)
}
