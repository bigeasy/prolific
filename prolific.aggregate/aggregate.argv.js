/*
    ___ usage ___ en_US ___
    usage: prolific average <options>

        -q, --qualified <string>
            The qualified name of the entry to aggregate.

        --help
            Display this message.

    ___ $ ___ en_US ___

    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    var util = require('util')

    program.helpIf(program.ultimate.help)

    var response = {
        moduleName: 'prolific.aggregate/aggregate.processor',
        parameters: { params: program.ultimate },
        argv: program.argv,
        terminal: program.terminal
    }

    if (program.isMainModule) {
        program.stdout.write(util.inspect(response, { depth: null }) + '\n')
    }

    return response
}))

module.exports.isProlific = true
