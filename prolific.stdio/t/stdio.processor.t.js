var Processor = require('../stdio.processor')

process.stdout.write('1..2\n')
process.stderr.write = function (buffer) {
    process.stdout.write(buffer)
}

Processor(null, {
    stderr: true
}, {
    process: function () {}
}, function (error, processor) {
    processor.process({ formatted: [ Buffer.from('ok 1 stderr\n') ] })
})

Processor(null, {}, {
    process: function () {}
}, function (error, processor) {
    processor.process({ formatted: [ Buffer.from('ok 2 stdout\n') ] })
})
