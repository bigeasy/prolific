var interval = setInterval(function () {}, 1000)

process.on('SIGINT', function () {
    console.log('child INT')
 //   clearInterval(interval)
})

process.on('SIGTERM', function () {
    console.log('child TERM')
//    clearInterval(interval)
})
