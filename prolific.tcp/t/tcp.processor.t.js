require('proof')(4, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../tcp.processor')
    var stream = require('stream')
    var sink = { process: function () {} }
    var processor = new Processor({
        params: { url: 'tcp://127.0.0.1:8086' }
    }, sink)
    var processor = new Processor({
        params: { url: 'tcp://127.0.0.1:8086', rotate: 5 }
    }, sink)
    var delta = require('delta')
    var net = require('net')
    var wait
    var server = net.createServer()

    async(function () {
        wait = async()
    }, function () {
        processor.open(async())
    }, function () {
        processor.process({ formatted: new Buffer('abc\n') })
    })

    async(function () {
        server.listen(8086, '127.0.0.1', async())
    }, function () {
        delta(async()).ee(server).on('connection')
        wait()
    }, function (socket) {
        async(function () {
            delta(async()).ee(socket).on('data')
        }, function (data) {
            assert(data.toString(), 'abc\n', 'tcp send')
            delta(async()).ee(socket).on('data')
            processor.process({ formatted: new Buffer('xyz\n') })
        }, function (data) {
            assert(data.toString(), 'xyz\n', 'tcp send rotate')
            delta(async()).ee(socket).on('end')
            processor.close(async())
        }, function () {
            server.close(async())
        })
    }, function () {
        processor._socket = {
            write: function (buffer, callback) {
                callback(new Error)
            }
        }
        processor._write(new Buffer(0), async())
    }, function () {
        assert(processor._socket, null, 'socket closed')
        processor._socket = {
            end: function (callback) {
                callback(new Error)
            }
        }
        processor._end(async())
    }, function () {
        assert(processor._socket, null, 'socket closed')
    })
}
