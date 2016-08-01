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
    program.helpIf(program.ultimate.help)
    var response = {
        moduleName: 'prolific.stdio/stdio.processor',
        parameters: { params: program.ultimate },
        argv: program.argv,
        terminal: program.terminal
    }
    if (program.isMainModule) {
        program.stdout.write(require('util').inspect(response, { depth: null }) + '\n')
    }
    return response
}))

module.exports.isProlific = true
