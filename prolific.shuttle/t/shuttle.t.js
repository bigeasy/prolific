require('proof')(7, require('cadence')(prove))

function prove (async, assert) {
    var fs = require('fs')
    var path = require('path')
    var abend = require('abend')
    var rimraf = require('rimraf')
    var Shuttle = require('../shuttle')
    var prolific = require('prolific')
    var logger = prolific.createLogger('prolific.shuttle.test')
    var stream = require('stream')
    var events = require('events')
    var program = new events.EventEmitter
    program.stdout = new stream.PassThrough
    program.stderr = new stream.PassThrough
    program.stderr.flag = 1
    var io = {
        async: new stream.PassThrough,
        sync: new stream.PassThrough
    }
    async(function () {
        rimraf(path.join(__dirname, 'logout'), async())
    }, [function () {
        rimraf(path.join(__dirname, 'logout'), async())
    }], function () {
        async(function () {
            fs.open(path.join(__dirname, 'logout'), 'w', 0644, async())
        }, [function (fd) {
            fs.close(fd, async())
        }], function (fd) {
            new Shuttle(io.async, String(fd), io.sync, function() {})
            var shuttle = new Shuttle(io.async, fd, io.sync, function (error) {
                assert(error.message, 'hello', 'uncaught handled')
            })
            io.async.write('{"key":"value"}\n')
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
        async(function () {
            fs.readFile(path.join(__dirname, 'logout'), 'utf8', async())
        }, function (body) {
            assert(body, 'aaaaaaaa 6eb9f4a5 9\naaaaaaaa\naaaaaaaa 9a86a096 10\n{"open":1}9a86a096 7a256dee 4\na\nb\n', 'log file')
            assert(io.sync.read().toString(), 'aaaaaaaa 21780b7e 9\n7a256dee\n7a256dee f29a668a 4\nc\nd\n', 'sync')
        })
    }, function () {
        Shuttle.shuttle({ env: {} }, 1000, {}, function () {}, async())
    }, function (result) {
        assert(!result, 'no fd')
        program = new events.EventEmitter
        program.env = {
            PROLIFIC_LOGGING_FD: new stream.PassThrough
        }
        program.stderr = new stream.PassThrough
        program.env.PROLIFIC_LOGGING_FD.write("{}\n")
        async(function () {
            Shuttle.shuttle(program, 1000, {}, function () {}, async())
        }, function (result) {
            assert(result, 'started')
            program.emit('exit')
        })
    })
}
