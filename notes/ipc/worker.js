var count = 0

process.on('message', function (message, socket) {
    socket.write('Hello, Worker!\r\n')
    socket.end()
})
