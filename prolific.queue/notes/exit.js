process.on('exit', function () {
    console.log('exited')
})

process.on('SIGINT', function () {
    console.log('SIGINT')
    clearInterval(interval)
})

var interval = setInterval(function () {}, 1000)
