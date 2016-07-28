#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    prolific.udp --bind ip:port

    options:

      --help
          display help message

      -b, --bind  <address:port>
          port to listen to

    ___ . ___

 */
require('arguable')(module, require('cadence')(function (async, program) {
    var Shuttle = require('prolific.shuttle')

    program.helpIf(program.command.param.help)
    program.command.required('bind')

    var logger = require('prolific.logger').createLogger('prolific.udp.listener')
    Shuttle.shuttle(program, 1000, logger)

    var dgram = require('dgram')
    var socket = dgram.createSocket('udp4')
    var prolific = require('prolific')
    socket.on('message', function (chunk) {
        prolific.sink.write(chunk)
    })
    program.on('SIGINT', socket.close.bind(socket))
    program.on('SIGTERM', socket.close.bind(socket))
    var bind = program.command.bind('bind')
    socket.bind(bind.port, bind.address, async())
}))
