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
    program.helpIf(program.command.params.help)
    var response = {
        moduleName: 'prolific.aggregate/aggregate.processor',
        parameters: { params: program.command.param },
        argv: program.argv,
        terminal: program.command.terminal
    }
    if (process.mainModule == module) {
        console.log(response)
    }
    return response
}))

module.exports.isProlific = true
