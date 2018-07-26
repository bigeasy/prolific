require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var prolific = require('..')
    var path = require('path')

    var child = path.join(__dirname, 'program.js')
    var configuration = path.join(__dirname, 'configuration.json')

    var program
    async(function () {
        program = prolific([ '--configuration', configuration, 'node', child ], async())
    }, function (code) {
        okay(code, 0, 'ran')
    })
}
