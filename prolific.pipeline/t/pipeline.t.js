require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Pipeline = require('..')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/pipline')

    var cadence = require('cadence')

    destructible.completed.wait(async())

    destructible.monitor('test', cadence(function (async, destructible) {
        async(function () {
            destructible.monitor('pipeline', Pipeline, [{
                module: 'prolific.test',
                key: 'x'
            }], async())
        }, function (processor, destructible) {
            okay(typeof processor.process, 'function', 'processor created')
            processor.process({})
            destructible.destroy()
        })
    }), null)
}
