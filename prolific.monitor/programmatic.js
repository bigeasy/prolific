module.exports = function (terminal, argv) {
    if (terminal || argv[0] == 'node') {
        return null
    }
    var command = argv[0], url = null
    if (~command.indexOf(':')) {
        url = command
        command = command.split(':')[0]
    }
    var pkg = command[0] == '@'
            ? command.substring(1)
            : 'prolific.' + command
    try {
        var required = require(pkg)
        if (!required.isProlific) {
            return null
        }
        argv.shift()
        if (url != null) {
            argv.unshift('--url', url)
        }
        return required
    } catch (e) {
        return null
    }
}
