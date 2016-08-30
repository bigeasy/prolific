/*
    ___ usage ___ en_US ___
    usage: prolific file <options>

        -f, --file <string>
            The base name of the file. It will have a retation timestamp
            appended to it.

            --help                      display this message
    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)
    var response = {
        moduleName: 'prolific.file/file.processor',
        parameters: program.ultimate,
        argv: program.argv,
        terminal: program.terminal
    }
    if (program.isMainModule) {
        program.stdout.write(require('util').inspect(response, { depth: null }) + '\n')
    }
    return response
}))
