var Processor = require('../stdio.processor')

var sink = { process: function () {} }
new Processor({ params: { stderr: true } }, sink)

var processor = new Processor({ params: {} }, sink)

process.stdout.write('1..1\n')

processor.open(function () {})

processor.process({})
processor.process({ formatted: new Buffer('ok 1 stdout\n') })

processor.close(function () {})
