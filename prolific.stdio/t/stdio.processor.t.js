var Processor = require('../stdio.processor')

var sink = { process: function () {} }
new Processor({ stderr: true }, sink)

var processor = new Processor({}, sink)

process.stdout.write('1..1\n')

processor.open(function () {})

processor.process({ formatted: [ new Buffer('ok 1 stdout\n') ] })

processor.close(function () {})
