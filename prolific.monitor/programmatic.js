module.exports = function (program, terminal, argv) {
    if (argv.length == 0) {
        program.abend('no program')
    }
    return terminal || !/^[\w.]+$/.test(argv[0]) || argv[0] == 'node' || (function () {
        try {
            return ! require('prolific.' + argv[0] + '/__prolific__').isProlific
        } catch (e) {
            return true
        }
    })()
}
