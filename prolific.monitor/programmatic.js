module.exports = function (program, terminal, argv) {
    if (argv.length == 0) {
        program.abend('no program')
    }
    return terminal || !/(^[\w.]+$|^[\w.]+:)/.test(argv[0]) || argv[0] == 'node' || (function () {
        try {
            var command = argv[0]
            if (~command.indexOf(':')) {
                argv.shift()
                argv.unshift(command.split(':')[0], '--url', command)
            }
            command = argv[0]
            return ! require('prolific.' + command + '/__prolific__').isProlific
        } catch (e) {
            return true
        }
    })()
}
