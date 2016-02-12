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
    var http = require('http')
    var server = http.createServer(function (request, response) {
        request.on('data', function (chunk) {
            program.stdout.write(chunk.toString())
        })
        request.on('end', function () {
            response.writeHead(200)
            response.end()
        })
    })
    server.listen(+program.param.port, async())
}))
