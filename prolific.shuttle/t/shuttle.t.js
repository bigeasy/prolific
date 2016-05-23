require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var fs = require('fs')
    var path = require('path')
    var abend = require('abend')
    var rimraf = require('rimraf')
    var Shuttle = require('../shuttle')
    var prolific = require('prolific')
    var children = require('child_process')
    var logger = prolific.createLogger('prolific.shuttle.test')
    var stream = require('stream')
    var events = require('events')
    var program = new events.EventEmitter
    program.stdout = new stream.PassThrough
    program.stderr = new stream.PassThrough
    program.stderr.flag = 1
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
