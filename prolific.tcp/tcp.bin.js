#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    node stdout.tcp.bin.js --bind ip:port

    options:

        --help                      display help message
        -b, --bind      <integer>   port to listen to
    ___ . ___

 */
require('arguable')(module, require('cadence')(function (async, program) {
    var net = require('net')

    program.helpIf(program.command.param.help)
    program.command.required('bind')

    var prolific = require('prolific')

    var bind = program.command.bind('bind')

    var server = net.createServer(function (socket) {
        socket.on('data', function (chunk) {
            prolific.sink.write(chunk)
        })
    })

    server.listen(bind.port, bind.address, async())
}))
