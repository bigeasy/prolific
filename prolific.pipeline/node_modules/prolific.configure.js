/*
    ___ usage ___ en_US ___
    usage: prolific configure
    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program, configuration) {
    configuration.configured = true
    return { moduleName: null, argv: program.argv, terminal: program.terminal }
}))

module.exports.isProlific = true
