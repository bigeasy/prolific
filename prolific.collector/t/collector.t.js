require('proof')(4, require('cadence')(prove))

function prove (async, assert) {
    var Collector = require('../collector')
    var Queue = require('prolific.queue')
    var fnv = require('hash.fnv')
    var buffer = new Buffer('a\nb\n')
    var hash = fnv(0, buffer, 0, buffer.length)
    var stream = require('stream')
    var stdout = new stream.PassThrough
    var queue = new Queue
    var reactor = []
    var collector = new Collector(reactor, true)
    var sink = queue.createSink(stdout)
    async(function () {
        queue.write('abc\n')
        queue.write('def\n')
    }, function () {
        sink.open(async())
    }, function () {
        sink.flush(async())
    }, function () {
        collector.scan(stdout.read())
        var entry = collector.chunks.shift()
        entry.buffer = entry.buffer.toString()
        assert(entry, {
            previousChecksum: 2863311530,
            checksum: 2700757720,
            length: 8,
            buffer: 'abc\ndef\n'
        }, 'chunk')
    }, function () {
        try {
            collector.scan(new Buffer('0 0 0\n'))
        } catch (error) {
            assert(error.message, 'dedicated stream sequence break', 'sequence break')
        }
        try {
            collector.scan(new Buffer('!\n'))
        } catch (error) {
            assert(error.message, 'dedicated stream garbled header', 'garbled header')
        }
        queue.write('ghi\n')
        queue.write('jkl\n')
        sink.flush(async())
    }, function () {
        var buffer = stdout.read()
        collector.scan(buffer.slice(0, 4))
        collector.scan(buffer.slice(4, 28))
        collector.scan(buffer.slice(28))
    }, function () {
        var entry = collector.chunks.shift()
        entry.buffer = entry.buffer.toString()
        assert(entry, {
            previousChecksum: 2700757720,
            checksum: 4286234924,
            length: 8,
            buffer: 'ghi\njkl\n'
        }, 'chunk')
    })
}
