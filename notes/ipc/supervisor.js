var spawn = require('child_process').spawn
var net = require('net')

var child = spawn('node', [
    '../../prolific.tcp/prolific.tcp.bin.js',
    '--ipc',
    '--log',
    '127.0.0.1:8088',
    'node',
    'worker.js'
], { stdio: [ 0, 1, 2, 'ipc' ] })

child.on('exit', function () { server.close() })

var server = net.createServer(function(socket) { child.send('server', socket) })

server.listen(8088)
