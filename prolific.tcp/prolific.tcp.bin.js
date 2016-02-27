/*
    ___ usage ___ en_US ___
    usage: node prolific.tcp.bin.js

        -l, --log       <string>        the udp address and port to send to
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

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.param.help)
    program.required('log')

    var send = program.param.log.split(':')
    var host = program.param.host = send[0]
    var port = program.param.port = +send[1]

    var sender = new Sender(host, port, program.stdout)

    // TODO Add to very end of existing stdio. This would require a command line
    // switch and it would mean that there would be inheritence for certain
    // number `--inherit=4` so that we'd put ourself after the last inherited.
    program.env.PROLIFIC_LOGGING_FD = '3'

    var child = children.spawn(program.argv.shift(), program.argv, {
        stdio: [ 'ignore', 'inherit', 'pipe', 'pipe' ],
        detatched: true // TODO `false`.
    })

    program.on('SIGINT', function () { child.kill('SIGINT') })

    async(function () {
        monitor(sender, child, child.stdio[3], child.stderr, program.stderr, async())
    }, function (code, signal) {
        // TODO Move this condition up to monitor.
        return [ code == null ? 1 : code ]
    })
}))
