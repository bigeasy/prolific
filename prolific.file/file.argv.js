/*
    ___ usage ___ en_US ___
    usage: prolific syslog <options>

        -f, --file <string>
            The base name of the file. It will have a retation timestamp
            appended to it.

            --help                      display this message

    ___ $ ___ en_US ___

    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.command.params.help)
    var response = {
        moduleName: 'prolific.file/file.processor',
        parameters: { params: program.command.param },
        argv: program.argv,
        terminal: program.command.terminal
    }
    if (process.mainModule == module) {
        console.log(response)
    }
    return response
}))
