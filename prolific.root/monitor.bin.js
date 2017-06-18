/*
    ___ usage ___ en_US ___
    usage: node monitor.bin.js

        -c, --configuration <string>    json configuration
            --help                      display this message

    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program) {
    // Node.js API.
    var assert = require('assert')

    // Construct a prolific pipeline from a configuration.
    var Pipeline = require('prolific.pipeline')

    // Controlled demolition of objects.
    var Destructible = require('destructible')

    // Consolidate chunks from async and sync streams.
    var Asynchronous = require('prolific.consolidator/asynchronous')

    var Signal = require('signal')
    var cadence = require('cadence')

    var Thereafter = require('thereafter')

    var thereafter = new Thereafter

    var destructible = new Destructible('monitor')

    var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
    var pipeline = new Pipeline(configuration)

    var net = require('net')

    var asynchronous = new Asynchronous(pipeline.processors[0])

    var finalized = new Signal

    var listener
    program.on('message', listener = function (message) {
        assert(message.module == 'prolific' && message.method == 'chunk')
        asynchronous.consume(message.body)
        finalized.unlatch()
    })
    destructible.addDestructor('messages', function () {
        program.removeListener('message', listener)
    })

    program.on('shutdown', destructible.destroy.bind(destructible))

    async(function () {
        setImmediate(async()) // allows test to get handle
    }, [function () {
        pipeline.close(async())
    }], function () {
        pipeline.open(async())
    }, function () {
        thereafter.run(function (ready) {
            cadence(function () {
                var socket = new net.Socket({ fd: 3 })
                destructible.addDestructor('socket', socket, 'destroy')
                async(function () {
                    asynchronous.listen(socket, async())
                    ready.unlatch()
                }, function () {
                    finalized.wait(5000, async())
                })
            })(destructible.monitor('asynchronous'))
        })
        thereafter.run(function (ready) {
            program.send({ module: 'prolific', method: 'ready' })
            ready.unlatch()
        })
        destructible.completed(3000, async())
    }, function () {
        return 0
    })
}))
