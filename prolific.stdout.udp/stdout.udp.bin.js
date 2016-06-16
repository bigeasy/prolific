#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    node stdout.udp.bin.js --bind ip:port

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
    socket.on('message', function (buffer) {
        program.stdout.write(buffer)
    })
    program.on('SIGINT', socket.close.bind(socket))
    async(function () {
        // TODO Bind should be port or port and address.
        socket.bind(+program.param.port, async())
    }, function () {
        return 0
    })
}))
