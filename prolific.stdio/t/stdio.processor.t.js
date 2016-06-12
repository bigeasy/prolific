var Processor = require('../stdio.processor')

new Processor({ params: { stderr: true } })

var processor = new Processor({ params: {} })

process.stdout.write('1..1\n')

processor.open(function () {})

processor.process({})
processor.process({ formatted: new Buffer('ok 1 stdout\n') })

processor.close(function () {})
