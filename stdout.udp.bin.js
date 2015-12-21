/*
    ___ usage ___ en_US ___
    node stdout.tcp.bin.js --bind ip:port

    options:

        --help                      display help message
        -p, --port      <integer>   port to listen to
    ___ . ___

 */
require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.param.help)
    program.required('port')
    var dgram = require('dgram')
    var socket = dgram.createSocket('udp4')
    socket.bind(+program.param.port)
    socket.on('message', function (chunk) {
        program.stdout.write(chunk.toString())
    })
}))
