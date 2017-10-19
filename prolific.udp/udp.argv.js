/*
    ___ usage ___ en_US ___
    usage: prolific udp <options>

        -u, --url <string>
            The URL of the logging destination.

        -s, --select <string>
            The path to get the URL of the logging destination.

        --help
            Display this message.
    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)
    var response = {
        moduleName: 'prolific.udp/udp.processor',
        parameters: program.ultimate,
        argv: program.argv,
        terminal: program.terminal
    }
    return response
}))

module.exports.isProlific = true
