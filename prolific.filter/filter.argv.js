/*
    ___ usage ___ en_US ___
    usage: prolific filter <options> [+select]

    options:

        -s, --select <javascript>
            Apply the specified JavaScript function body to each entry. The
            function body will be invoked with the log entry in a variable named
            `$`. The level will be converted to integer and specified as $level.

        --help
            Display this message.

    description:

      Execute a JavaScript function on each entry. The JavaScript function body
      is specified in the command line. The entry is given to the function as
      the `$` parameter. You

      prolific filter --select '$.http.duration > 1000'

      You can shorten the command line using the `+` prefix to the function
      body. The first argument to `filter` is the function body prefixed by the
      character `+`.

      prolific filter +'$.http.duration > 1000'

      To simplify selecting records based on context, you can use the `$context`
      variable. It is an array. Each element in the array corresponds to a path
      in the context. This let's you match against parent context without having
      to use regular expressions or substrings.

      prolific filter +'$context[2] == "bigeasy.server" && $http.duration > 1000'

      The above would match the sub-contexts "bigeasy.server.frontend" and
      "bigeasy.server.backend".

      You can also match against the integer value of the level. The level is
      placed in the `$level` variable. You can use the constants `ERROR`,
      `WARN`, `INFO` and `TRACE` to make comparisons.

      prolific filter +'$context[2] == "bigeasy.server" && $level <= TRACE'
    ___ . ___
*/

// TODO Likely want to make this simply take single argument, no `--select` and
// no `+` prefix.

require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)

    var response = {
        moduleName: 'prolific.filter/filter.processor',
        parameters: program.ultimate,
        argv: program.argv,
        terminal: program.terminal
    }

    if (program.isMainModule) {
        program.stdout.write(require('util').inspect(response, { depth: null }) + '\n')
    }

    return response
}))

module.exports.isProlific = true
