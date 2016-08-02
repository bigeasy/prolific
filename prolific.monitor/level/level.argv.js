/*
    ___ usage ___ en_US ___
    usage: prolific @prolific.monitor/level LEVEL path=LEVEL

        --help
            Display this message.

    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)

    var argv = program.argv.slice()
    var LEVEL = [ 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE' ]

    var levels = []
    while (argv.length && (~argv[0].indexOf('=') || ~LEVEL.indexOf(argv[0]))) {
        var level = argv.shift().split('=')
        if (level.length == 1) {
            levels.push({ path: '', level: level[0] })
        } else {
            levels.push({ path: level[0], level: level[1] })
        }
    }

    var response = {
        moduleName: 'prolific.monitor/level/level.processor',
        parameters: { levels: levels },
        argv: argv,
        terminal: program.terminal
    }

    if (program.isMainModule) {
        program.stdout.write(require('util').inspect(response, { depth: null }) + '\n')
    }

    return response
}))

module.exports.isProlific = true
