/*
    ___ usage ___ en_US ___
    usage: node prolific.tcp.bin.js

        -l, --log       <string>        the udp address and port to send to
        -i, --inherit   <number>        file handles to inherit
        -I, --ipc                       enable Node.js IPC forwarding
            --help                      display this message

    ___ $ ___ en_US ___

        log is required:
            the `--log` address and port is a required argument

        port is not an integer:
            the `--log` port must be an integer

    ___ . ___
*/

var monitor = require('prolific.monitor')
var Sender = require('prolific.sender.tcp')
var children = require('child_process')
var inherit = require('prolific.inherit')
var ipc = require('prolific.ipc')

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.command.param.help)
    program.command.required('log')

    program.on('SIGTERM', function () {})

    var send = program.command.param.log.split(':')
    var host = send[0]
    var port = +send[1]

    var sender = new Sender(host, port, program.stdout)
    var stdio = inherit(program)

    // TODO Add to very end of existing stdio. This would require a command line
    // switch and it would mean that there would be inheritence for certain
    // number `--inherit=4` so that we'd put ourself after the last inherited.
    program.env.PROLIFIC_LOGGING_FD = String(stdio.length - 1)

    var child = children.spawn(program.argv.shift(), program.argv, { stdio: stdio })

    ipc(program.command.param.ipc, process, child)
    monitor(sender, child, child.stdio[stdio.length - 1], child.stderr, program.stderr, async())
}))
