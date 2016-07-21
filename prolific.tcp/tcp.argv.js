/*
    ___ usage ___ en_US ___
    usage: prolific tcp <options>

        -u, --url <string>
            The URL of the logging destination.

        -r, --rotate <number>
            Reopen TCP connection after specified number of bytes.

        --help
            Display this message.

    ___ $ ___ en_US ___

    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.command.params.help)
    var response = {
        moduleName: 'prolific.tcp/tcp.processor',
        parameters: { params: program.command.param },
        argv: program.argv,
        terminal: program.command.terminal
    }
    if (process.mainModule == module) {
        console.log(response)
    }
    return response
}))
