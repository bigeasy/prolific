/*
    ___ usage ___ en_US ___
    usage: prolific syslog <options>

        -q, --qualified <string>
            The qualified name of the entry to aggregate.

        -c, --calculate <string>
            A calculated value to add to the record at the end of collection.

        -g, --gather <string>
            An action to perform on each incoming record.

        -p, --pivot <string>
            A generated key to pivot upon.

        -e, --end <string>
            A value that indicates the end of a reduction.

        -t, --timeout <number>
            The point at which a log line times out.

            --help                      display this message
    ___ . ___
*/

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)
    var coalesce = require('extant')
    var parameters = {
        qualified: program.ultimate.qualified,
        pivot: program.ultimate.pivot,
        calculate: program.grouped.calculate,
        gather: program.grouped.gather,
        end: program.ultimate.end,
        timeout: coalesce(program.ultimate.timeout, '30000')
    }
    return  {
        moduleName: 'prolific.reduce/reduce.processor',
        parameters: parameters,
        argv: program.argv,
        terminal: program.terminal
    }
}))

module.exports.isProlific = true
