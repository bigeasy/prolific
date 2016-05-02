/*
    ___ usage ___ en_US ___
    node stdout.child.bin.js --bind ip:port

    options:

        --help                      display help message
        -b, --bind      <integer>   port to listen to
    ___ . ___

 */
require('arguable')(module, require('cadence')(function (async, program) {
    var Delta = require('delta')
    var Reactor = require('reactor')
    var cadence = require('cadence')
    var byline = require('byline')

    program.helpIf(program.command.param.help)
    program.command.required('bind')

    var pair = program.command.param.bind.split(':')
    var processes = require('child_process')
    if (pair.length == 1) {
        var host = '0.0.0.0'
        var port = +pair[0]
    } else {
        var host = pair[0]
        var port = +pair[1]
    }

    var argv = program.argv.slice()
    var child = processes.spawn(argv.shift(), argv, { stdio: [ 'pipe', 'inherit', 'inherit' ] })

    var server
    async(function () {
        new Delta(async()).ee(child).on('exit')
    }, function (code, signal) {
        server.close()
        return [ signal ? 1 : code ]
    })

    var lines = []
    var sender = new Reactor({
        operation: cadence(function (async) {
            var batch = lines.splice(0, 256)
            batch.push('')
            child.stdin.write(batch.join('\n'), async())
        })
    })

    var net = require('net')
    var server = net.createServer(function (socket) {
        byline(socket).on('data', function (data) {
            lines.push(data)
            sender.check()
        })
        socket.on('error', function (error) { console.error(error.stack) })
    })

    server.listen(port, host, async())

    program.on('SIGINT', function () {})
}))
