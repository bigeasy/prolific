require('proof')(2, require('cadence')(prove))

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
            var shuttle = new Shuttle(program, fd, 250)
            shuttle.run(abend)
            async(function () {
                shuttle.queue.write('a\n')
                shuttle.queue.write('b\n')
                setTimeout(async(), 500)
            }, function () {
                shuttle.queue.write('c\n')
                shuttle.queue.write('d\n')
                shuttle.stop()
                shuttle.stop()
            })
        })
    }, function () {
        async(function () {
            fs.readFile(path.join(__dirname, 'logout'), 'utf8', async())
        }, function (body) {
            assert(body, 'aaaaaaaa 6eb9f4a5 9\naaaaaaaa\naaaaaaaa 7a256dee 4\na\nb\n', 'log file')
            assert(program.stderr.read().toString(), 'aaaaaaaa 21780b7e 9\n7a256dee\n7a256dee f29a668a 4\nc\nd\n', 'stderr')
        })
    })
}
