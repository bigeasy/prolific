/*
    ___ usage ___ en_US ___
    node stdout.tcp.bin.js --bind ip:port

    options:

        --help                      display help message
        -b, --bind      <integer>   port to listen to
    ___ . ___

 */
require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.param.help)
    program.required('bind')
    var pair = program.param.bind.split(':')
    if (pair.length == 1) {
        var host = '0.0.0.0'
        var port = +pair[0]
    } else {
        var host = pair[0]
        var port = +pair[1]
    }
    var net = require('net')
    var server = net.createServer(function (socket) {
        socket.on('data', function (chunk) {
            program.stdout.write(chunk.toString())
        })
    })
    server.listen(port, host, async())
}))
