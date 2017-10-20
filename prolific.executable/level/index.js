/*
    ___ usage ___ en_US ___
    usage: prolific @prolific.monitor/level LEVEL path=LEVEL

        --help
            Display this message.

    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program, configuration) {
    program.helpIf(program.ultimate.help)

    var argv = program.argv.slice()
    var LEVEL = [ 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE' ]

    var levels = []
    while (argv.length && (~argv[0].indexOf('=') || ~LEVEL.indexOf(argv[0]))) {
        var level = argv.shift().split('=')
        if (level.length == 1) {
            configuration.levels.push({ path: '', level: level[0] })
        } else {
            configuration.levels.push({ path: level[1], level: level[0] })
        }
    }

    return { argv: argv, terminal: program.terminal }
}))

module.exports.isProlific = true
