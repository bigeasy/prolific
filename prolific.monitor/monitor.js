var Consolidator = require('prolific.consolidator')
var delta = require('delta')
var rescue = require('rescue')
var cadence = require('cadence')
var push = [].push

var LEVEL = {
    trace: 0,
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
// TODO: Fatal.
}

module.exports = cadence(function (async, processor, child, io, forward) {
    var configuration = null
    var consolidator = new Consolidator
    function process (line) {
        var json = JSON.parse(line)
        var qualifier = json.qualifier.split('.').map(function (value, index, array) {
            return array.slice(0, index + 1).join('.')
        })
        qualifier.unshift(null)
        processor.process({
            formatted: null,
            when: json.when,
            qualifier: qualifier,
            level: LEVEL[json.level],
            json: json
        })
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
        delta(async())
            .ee(child).on('exit')
            .ee(io.sync).on('data', consolidator.sync.ondata)
                        .on('data', onLine).on('end')
        async([function () {
            delta(async())
                .ee(io.async)
                    .on('data', consolidator.async.ondata)
                    .on('data', onChunk).on('end')
        }, function (error) {
            child.kill()
// TODO Revisit this. Which operating system generated this error?
// Error was ECONNRESET.
            console.log(error.stack)
        }])
    }, function (code, signal) {
        consolidator.exit()
        onChunk()
        return [ code == null ? 1 : code, configuration ]
    })
})
