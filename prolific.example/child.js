process.on('SIGTERM', function () { console.log('SIGTERM') })
return
var net = require('net')

var socket = new net.Socket({ fd: 3 })
socket.destroy()
process.stdout.end()
process.stdin.resume()
process.disconnectIf()

setInterval(function () {}, 1000)
