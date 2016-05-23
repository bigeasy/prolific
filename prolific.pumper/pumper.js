var Consolidator = require('prolific.consolidator')
var Delta = require('delta')
var cadence = require('cadence')

module.exports = cadence(function (async, senders, child, io, forward) {
    var configuration = null
    var consolidator = new Consolidator
    var sender = function (chunks) {
        if (chunks.length) {
            configuration = JSON.parse(chunks.shift().buffer.toString())
            sender = function (chunks) {
                for (var i = 0, I = chunks.length; i < I; i++) {
                    for (var j = 0, J = senders.length; j < J; j++) {
                        senders[j].send(chunks[i].buffer)
                    }
                }
            }
            sender(chunks)
        }
    }
    function onChunk () {
        sender(consolidator.chunks.splice(0, consolidator.chunks.length))
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
            console.log(error.stack)
        }])
    }, function (code, signal) {
        consolidator.exit()
        onChunk()
        return [ code == null ? 1 : code, configuration ]
    })
})
