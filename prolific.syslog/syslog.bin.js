/*
    ___ usage ___ en_US ___
    usage: prolific syslog <options>

        -a, --application <string>
            The application name to display in the syslog record. Defaults to
            the value of `process.title` which will always be `node`.

        -h, --hostname <string>
            The hostname to display in the syslog record. Defaults to the value
            of `require('os').hostname()`.

        -f, --facility <string>
            The syslog facility to encode in the syslog record. Defaults to `local0`.

        -p, --pid <string>
            The process id to display in the syslog record. Defaults to
            the value of `process.pid`.

        -s, --serializer <string>
            The type of serializer for the payload. Defaults to "json".

            --help                      display this message

    ___ $ ___ en_US ___

    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.command.param.help)

    var logger = require('prolific.logger').createLogger('bigeasy.prolific.syslog.bin')
    var querylist = require('querylist')

    var Shuttle = program.require('prolific.shuttle')

    Shuttle.shuttle(program, 1000, {
        moduleName: 'prolific.syslog/syslog',
        url: 'syslog' + querylist.stringify(program.command.ordered)
    }, logger)

    return 0
}))
