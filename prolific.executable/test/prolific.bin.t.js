require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var prolific = require('..')
    var path = require('path')

    var child = path.join(__dirname, 'program.js')
    var configuration = path.join(__dirname, 'prolific.bin.prolific.js')

    var stream = require('stream')
    var program
    async(function () {
        program = prolific([ '--inherit', '99', '--configuration', configuration, 'node', child ], {
            $stderr: new stream.PassThrough({ highWaterMark: 1 })
        }, async())
    }, function (child) {
        child.options.$stderr.on('data', function (chunk) {
            console.log(chunk.toString())
        })
        async(function () {
            child.exit(async())
        }, function (code) {
            okay(code, 0, 'ran')
        })
    })
}
