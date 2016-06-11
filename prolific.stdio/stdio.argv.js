/*
    ___ usage ___ en_US ___
    usage: prolific stdio

        -o, --stdout                    use stdout (default)
        -e, --stderr                    use stderr
            --help                      display this message

    ___ $ ___ en_US ___

        log is required:
            the `--log` address and port is a required argument

        port is not an integer:
            the `--log` port must be an integer

    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.command.params.help)
    var parameters = {
        moduleName: 'prolific.stdio/stdio.sender',
        params: program.command.param,
        terminal: program.command.terminal
    }
    if (process.mainModule == module) {
        console.log(parameters)
    }
    return parameters
}))
