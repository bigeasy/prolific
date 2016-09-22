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

    program.helpIf(program.ultimate.help)
    program.required('bind')
    program.validate(require('arguable/bindable'), 'bind')

    var destroyer = require('server-destroy')
    var prolific = require('prolific')
    var logger = require('prolific.logger').createLogger('prolific.tcp.listener')
    var Shuttle = require('prolific.shuttle')
    var Staccato = require('staccato')
    var cadence = require('cadence')
    var abend = require('abend')
    var byline = require('byline')

    var shuttle = Shuttle.shuttle(program, logger)

    var split = cadence(function (async, socket) {
        var staccato = new Staccato(byline(socket))
        var loop = async(function () {
            async(function () {
                staccato.read(async())
            }, function (line) {
                if (line == null) {
                    return loop.break
                }
                console.log(line.toString())
                Shuttle.sink.writer.write(line)
            })
        })()
    })

    var server = net.createServer(function (socket) { split(socket, abend) })
    destroyer(server)

    program.once('shutdown', server.destroy.bind(server))
    program.on('shutdown', shuttle.close.bind(shuttle))

    var bind = program.ultimate.bind
    server.listen(bind.port, bind.address, async())
}))
