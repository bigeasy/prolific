var Consolidator = require('prolific.consolidator')
var Delta = require('delta')
var cadence = require('cadence')
var push = [].push

module.exports = cadence(function (async, processor, child, io, forward) {
    var configuration = null
    var consolidator = new Consolidator
    function process (line) {
        processor.process({ entry: JSON.parse(line) })
    }
    function onChunk () {
        consolidator.chunks.splice(0, consolidator.chunks.length).forEach(function (chunk) {
            var lines = chunk.buffer.toString().split(/\n/)
            lines.pop()
            lines.forEach(process)
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
