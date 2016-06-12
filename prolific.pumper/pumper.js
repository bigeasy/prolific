var Consolidator = require('prolific.consolidator')
var Delta = require('delta')
var cadence = require('cadence')
var push = [].push

module.exports = cadence(function (async, processors, child, io, forward) {
    var configuration = null
    var consolidator = new Consolidator
    function onChunk () {
        consolidator.chunks.splice(0, consolidator.chunks.length).forEach(function (chunk) {
            var lines = chunk.buffer.toString().split(/\n/)
            console.log(lines)
            lines.pop()
            var entries = {
                input: lines.map(function (line) { return JSON.parse(line) }),
                output: []
            }
            processors.forEach(function (processor) {
                entries.input.forEach(function (entry) {
                    push.apply(entries.output, processor.process(entry))
                })
                entries = { input: entries.output, output: [] }
            })
        })
    }
    function onLine () {
        forward.write(consolidator.stderr.splice(0, consolidator.stderr.length).join(''))
    }
    async(function () {
        new Delta(async())
            .ee(child).on('exit')
            .ee(io.sync).on('data', consolidator.sync.ondata)
                        .on('data', onLine).on('end')
        async([function () {
            new Delta(async())
                .ee(io.async)
                    .on('data', consolidator.async.ondata)
                    .on('data', onChunk).on('end')
        }, /^ECONNRESET$/, function (error) {
// TODO Revisit this. Which operating system generated this error?
            console.log(error.stack)
        }])
    }, function (code, signal) {
        consolidator.exit()
        onChunk()
        return [ code == null ? 1 : code, configuration ]
    })
})
