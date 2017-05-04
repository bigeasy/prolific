/*
    ___ usage ___ en_US ___
    usage: prolific tee <options>

            --help                      display this message

    ___ $ ___ en_US ___

    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)
    var Pipeline = require('prolific.pipeline')
    var configuration = { processors: [] }
    async(function () {
        Pipeline.parse(program, configuration, async())
    }, function (configuration, argv, terminal) {
        var response = {
            moduleName: 'prolific.tee/tee.processor',
            parameters: { configuration: configuration },
            argv: argv,
            terminal: terminal
        }
        return response
    })
}))
