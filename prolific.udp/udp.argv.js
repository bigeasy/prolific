/*
    ___ usage ___ en_US ___
    usage: prolific udp <options>

        -u, --url <string>
            The URL of the logging destination.

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
    if (program.isMainModule) {
        program.stdout.write(require('util').inspect(response, { depth: null }) + '\n')
    }
    return response
}))

module.exports.isProlific = true
