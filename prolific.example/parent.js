var children = require('child_process')

var child = children.spawn('node', [ './child.js' ], { stdio: [ 0, 1, 'pipe', 'pipe' ] })

child.stderr.on('end', function () { console.log('stderr') })
//child.stdout.on('end', function () { console.log('stdout') })
child.stdio[3].on('end', function () { console.log('stdio'); child.kill() })
child.on('exit', function (code) { console.log('exit', code) })
