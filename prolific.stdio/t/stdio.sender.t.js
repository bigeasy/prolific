var Sender = require('../stdio.sender')

new Sender({ params: { stderr: true } })

var sender = new Sender({ params: {} })

process.stdout.write('1..1\n')

sender.open(function () {})

sender.process({})
sender.process({ formatted: new Buffer('ok 1 stdout\n') })

sender.close(function () {})
