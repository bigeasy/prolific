require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Pipeline = require('..')
    var pipeline = new Pipeline([{
        module: 'prolific.test',
        key: 'x'
    }])
    async(function () {
        pipeline.open(async())
    }, function () {
        pipeline.processors[0].process({})
    }, function () {
        pipeline.close(async())
    }, function () {
        okay(1, 'ran')
    })
}
