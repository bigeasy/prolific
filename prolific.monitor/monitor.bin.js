/*
    ___ usage ___ en_US ___
    usage: node prolific.tcp.bin.js

        -l, --url       <string>        the url port to logs to
        -i, --inherit   <number>        file handles to inherit
        -I, --ipc                       enable Node.js IPC forwarding
            --configuration <string>    base configuration
            --help                      display this message

    ___ $ ___ en_US ___

        log is required:
            the `--log` address and port is a required argument

        port is not an integer:
            the `--log` port must be an integer

    ___ . ___
*/

var pumper = require('prolific.pumper')
var children = require('child_process')
var inherit = require('prolific.inherit')
var ipc = require('prolific.ipc')
var url = require('url')

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.command.param.help)

    program.on('SIGTERM', function () {})

    var configuration = program.command.param.configuration || '{}'
    configuration = JSON.parse(configuration)
    configuration.senders || (configuration.senders = [])
    program.command.params.url.forEach(function (location) {
        var parsed = url.parse(location)
        var protocol = parsed.protocol.substring(0, parsed.protocol.length - 1)
        var moduleName =  [ 'prolific.sender', protocol ].join('.')
        configuration.senders.push({ moduleName: moduleName, url: location })
    })
    var senders = configuration.senders.map(function (sender) {
        var Sender = require(sender.moduleName)
        return new Sender(sender, program.stdout)
    })

    var stdio = inherit(program)

    // TODO Add to very end of existing stdio. This would require a command line
    // switch and it would mean that there would be inheritence for certain
    // number `--inherit=4` so that we'd put ourself after the last inherited.
    process.env.PROLIFIC_LOGGING_FD = String(stdio.length - 1)

    var argv = program.argv.slice()
    var loop = async(function () {
        var child = children.spawn(argv.shift(), argv, { stdio: stdio })
        ipc(program.command.param.ipc, process, child)
        child.stdio[stdio.length - 1].write(JSON.stringify(configuration) + '\n')
        pumper(senders, child, child.stdio[stdio.length - 1], child.stderr, program.stderr, async())
    }, function (code, sender) {
        if (code != 0 || sender.moduleName == null) {
            return [ loop.break, code ]
        }
        configuration.senders.push(sender)
        var Sender = require(sender.moduleName)
        senders.push(new Sender(sender))
        argv = sender.argv
    })()
}))
