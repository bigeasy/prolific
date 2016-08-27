/*
    ___ usage ___ en_US ___
    usage: prolific average <options>

        -q, --qualified <string>
            The qualified name of the entry to aggregate.

        --help
            Display this message.
    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)

    var response = {
        moduleName: 'prolific.aggregate/aggregate.processor',
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
