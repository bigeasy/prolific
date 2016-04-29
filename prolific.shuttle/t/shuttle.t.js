require('proof')(7, require('cadence')(prove))

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
    async(function () {
        async(function () {
            var shuttle = new Shuttle(io.input, io.output, io.sync, function (error) {
                assert(error.message, 'hello', 'uncaught handled')
            })
            io.input.write('{"key":"value"}\n')
            async(function () {
                shuttle.open({ open: 1 }, async())
            }, function () {
                assert(shuttle.configuration, { key: 'value' }, 'configuration')
                shuttle.queue.write('a\n')
                shuttle.queue.write('b\n')
                shuttle.sink.flush(async())
            }, function () {
                shuttle.queue.write('c\n')
                shuttle.queue.write('d\n')
                try {
                    shuttle.uncaughtException(new Error('hello'))
                } catch (e) {
                    assert(e.message, 'hello', 'uncaught')
                }
                shuttle.stop()
            })
        })
    }, function () {
        assert(io.output.read().toString(), 'aaaaaaaa 6eb9f4a5 9\naaaaaaaa\naaaaaaaa 9a86a096 10\n{"open":1}9a86a096 7a256dee 4\na\nb\n', 'log file')
        assert(io.sync.read().toString(), 'aaaaaaaa 21780b7e 9\n7a256dee\n7a256dee f29a668a 4\nc\nd\n', 'sync')
    }, function () {
        var util = require('util')
        function _Socket () {
            stream.PassThrough.call(this)
            this.write('{"bootstrap":true}\n')
        }
        util.inherits(_Socket, stream.PassThrough)
        var bootstrap = require('../bootstrap').createShuttle({ Socket: _Socket }, Shuttle)
        async(function () {
            bootstrap({ env: {} }, 1000, {}, function () {}, async())
        }, function (result) {
            assert(!result, 'no fd')
            program = new events.EventEmitter
            program.env = { PROLIFIC_LOGGING_FD: '3' }
            program.stderr = new stream.PassThrough
            async(function () {
                bootstrap(program, 1000, {}, function () {}, async())
            }, function (result) {
                assert(result, 'started')
                program.emit('exit')
            })
        })
    })
}
