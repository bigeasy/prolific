/*
    ___ usage ___ en_US ___
    usage: prolific sprintf <format> <value>..

            --help                      display this message

    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)
    return  {
        moduleName: 'prolific.l2met/l2met.processor',
        parameters: {},
        argv: program.argv.slice(),
        terminal: program.terminal
    }
}))

module.exports.isProlific = true
