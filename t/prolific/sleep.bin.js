setInterval(function () {}, 1000)

process.on('exit', function () {
    console.error('goodbye')
})
