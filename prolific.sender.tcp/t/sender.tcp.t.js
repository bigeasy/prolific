require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var Sender = require('..')
    var stream = require('stream')
    var sync = new stream.PassThrough
    var sender = new Sender('127.0.0.1', 8086, sync)
    var Delta = require('delta')
    var net = require('net')
    var wait
    var server = net.createServer()

    async(function () {
        wait = async()
    }, function () {
        sender.send(new Buffer('abc\n'))
    })

    async(function () {
        server.listen(8086, '127.0.0.1', async())
    }, function () {
        new Delta(async()).ee(server).on('connection')
        wait()
    }, function (socket) {
        new Delta(async()).ee(socket).on('data', []).on('end')
    }, function (data) {
        assert(Buffer.concat(data).toString(), 'abc\n', 'tcp send')
        server.close(async())
    }, function () {
        new Delta(async()).ee(sync).on('data')
        sender.send(new Buffer('abc\n'))
    }, function (data) {
        assert(data.toString(), 'abc\n', 'sync send')
    }, function () {
        sender.close(async())
    })
}
