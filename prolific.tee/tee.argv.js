/*
    ___ usage ___ en_US ___
    usage: prolific tee <options>

            --help                      display this message

    ___ $ ___ en_US ___

    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.command.params.help)
    var isProgram = require('prolific.monitor/programmatic')
    var argv = program.argv.slice(), terminal = false
    var configuration = { processors: [] }
    async(function () {
        var loop = async(function () {
            if (argv.length == 0 || isProgram(program, terminal, argv)) {
                return [ loop.break ]
            }
            var command = argv.shift()
            var parser = require('prolific.' + command + '/' + command + '.argv')
            async(function () {
                parser(argv, async())
            }, function (processor) {
                configuration.processors.push(processor)
                argv = processor.argv
                terminal = processor.terminal
            })
        })()
    }, function () {
        var response = {
            moduleName: 'prolific.tee/tee.processor',
            parameters: { configuration: configuration },
            argv: argv,
            terminal: terminal
        }
        if (process.mainModule == module) {
            console.log(response)
        }
        return response
    })
}))
