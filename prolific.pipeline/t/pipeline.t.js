require('proof')(2, require('cadence')(prove))

function prove (async, okay) {
    var Pipeline = require('..')
    var pipeline = new Pipeline({
        processors: [{
            moduleName: 'prolific.test/test.processor',
            parameters: {}
        }]
    })
    async(function () {
        Pipeline.parse({
            argv: [ 'test', '--key', 'x', 'program' ],
            assert: function () {}
        }, {
            processors: []
        }, async())
    }, function (configuration, argv, terminal) {
        okay({
            configuration: configuration,
            argv: argv,
            terminal: terminal
        }, {
            configuration: {
                processors: [{
                    moduleName: 'prolific.test/test.processor',
                    parameters: { params: { key: 'x' } },
                    argv: [ 'program' ],
                    terminal: false
                }]
            },
            argv: [ 'program' ],
            terminal: false
        }, 'parse')
        pipeline.open(async())
    }, function () {
        pipeline.processors[0].process({})
    }, function () {
        pipeline.close(async())
    }, function () {
        okay(1, 'ran')
    })
}
