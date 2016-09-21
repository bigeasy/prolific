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

    program.helpIf(program.ultimate.help)
    program.required('bind')
    program.validate(require('arguable/bindable'), 'bind')

    var logger = require('prolific.logger').createLogger('prolific.udp.listener')
    var shuttle = Shuttle.shuttle(program, logger)

    var dgram = require('dgram')
    var socket = dgram.createSocket('udp4')
    var prolific = require('prolific')
    socket.on('message', function (chunk) {
        Shuttle.sink.writer.write(chunk)
    })

    // Interesting example, use indempotent shuttle close to hang onto `SIGINT`
    // and `SIGTERM`, but use `once` to keep from double closing socket.
    program.once('shutdown', socket.close.bind(socket))
    program.on('shutdown', shuttle.close.bind(shuttle))
    // Could do this whenever `once` is needed, it would get tested.
    // program.on('shutdown', function() {})

    var bind = program.ultimate.bind
    socket.bind(bind.port, bind.address, async())
}))
