/*
    ___ usage ___ en_US ___
    usage: node prolific.bin.js

        -u, --udp       <string>    the udp address and port to send to
            --help                  display this message

    ___ $ ___ en_US ___

        udp is required:
            the `--udp` address and port is a required argument

        port is not an integer:
            the `--udp` port must be an integer

    ___ . ___
*/

var children = require('child_process')
var dgram = require('dgram')
var Delta = require('delta')

function Writer(socket, host, port) {
    this._socket = socket
    this._host = host
    this._port = port
    this._remainder = ''
    this.onwrite = this.write.bind(this)
}

Writer.prototype.write = function (chunk) {
    var lines = (this._remainder + chunk.toString()).split(/\n/)
    this._remainder = lines.pop()
    lines.forEach(function (line) {
        var buffer = new Buffer(line)
        this._socket.send(buffer, 0, buffer.length, this._port, this._host)
    }, this)
}

require('arguable')(module, require('cadence')(function (async, options) {
    options.helpIf(options.param.help)
    options.required('udp')

    var send = options.param.udp.split(':')
    var host = options.param.host = send[0]
    var port = options.param.port = +send[1]

    var socket = new dgram.Socket('udp4')
    var child = children.spawn(options.argv.shift(), options.argv, {
        stdio: [ 'ignore', 'pipe', 'pipe', 'pipe' ],
        detatched: true
    })
    options.signal('SIGINT', function () { if (child) process.kill(child.pid) })
    async(function () {
        var delta = new Delta(async())
        delta.ee(child).on('close')
             .ee(child.stdout).on('data', new Writer(socket, host, port).onwrite)
             .ee(child.stderr).on('data', new Writer(socket, host, port).onwrite)
             .ee(child.stdio[3]).on('data', new Writer(socket, host, port).onwrite)
    }, function (code, signal) {
        child = null
        socket.close()
        return [ code == null ? 1 : code ]
    })
}))
