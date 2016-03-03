/*
    ___ usage ___ en_US ___
    usage: node prolific.tcp.bin.js

        -l, --log       <string>        the udp address and port to send to
        -i, --inherit   <number>        file handles to inherit
            --help                      display this message

    ___ $ ___ en_US ___

        udp is required:
            the `--udp` address and port is a required argument

        port is not an integer:
            the `--udp` port must be an integer

    ___ . ___
*/

var monitor = require('prolific.monitor')
var Sender = require('prolific.sender.tcp')
var children = require('child_process')
var inherit = require('prolific.inherit')

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.param.help)
    program.required('log')

    program.on('SIGTERM', function () {})

    var send = program.param.log.split(':')
    var host = program.param.host = send[0]
    var port = program.param.port = +send[1]

    var sender = new Sender(host, port, program.stdout)
    var stdio = inherit(program.params.inherit)

    // TODO Add to very end of existing stdio. This would require a command line
    // switch and it would mean that there would be inheritence for certain
    // number `--inherit=4` so that we'd put ourself after the last inherited.
    program.env.PROLIFIC_LOGGING_FD = String(stdio.length - 1)

    var child = children.spawn(program.argv.shift(), program.argv, { stdio: stdio })

    monitor(sender, child, child.stdio[stdio.length - 1], child.stderr, program.stderr, async())
}))
