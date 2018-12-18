/*
    ___ usage ___ en_US ___
    usage: prolific sprintf <format> <value>..

            --help                      display this message

    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)
    // TODO Assert that there are values.
    var argv = program.argv.slice()
    var format = argv.shift()
    var extractors = []
    while (argv.length && /\$/.test(argv[0])) {
        extractors.push(argv.shift())
    }
    var terminal = argv[0] == '--'
    if (terminal) {
        argv.shift()
    }
    return  {
        moduleName: 'prolific.sprintf/sprintf.processor',
        parameters: { format: format, extractors: extractors },
        argv: argv,
        terminal: terminal
    }
}))

module.exports.isProlific = true
