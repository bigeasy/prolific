var Sender = require('..')
var stream = require('stream')
var sender = new Sender({ url: 'stdio:stdout' })

process.stdout.write('1..1\n')

sender.send(new Buffer('ok 1 stdout\n'))

sender.close(function () {})
