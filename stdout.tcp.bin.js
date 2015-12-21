/*
    ___ usage ___ en_US ___
    node stdout.tcp.bin.js --bind ip:port

    options:

        --help                      display help message
        -p, --port      <integer>   port to listen to
    ___ . ___

 */
require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.param.help)
    program.required('port')
    var net = require('net')
    var server = net.createServer(function (socket) {
        socket.on('data', function (chunk) {
            program.stdout.write(chunk.toString())
        })
    })
    server.listen(+program.param.port, async())
}))
