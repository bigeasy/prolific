var path = require('path')
var spawn = require('child_process').spawn

var child = spawn('node', [ path.join(__dirname, 'child.js') ], { stdio: [ 0, 1, 2 ] })

child.on('exit', function (code, signal) {
    console.log(code, signal)
})

setTimeout(function () {
    console.log('int child!')
    child.kill('SIGINT')
}, 5000)

process.on('SIGINT', function () { console.log('parent INT') })
