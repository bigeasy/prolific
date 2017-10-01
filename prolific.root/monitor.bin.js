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

    var destructible = new Destructible('prolific.monitor')
    program.on('shutdown', destructible.destroy.bind(destructible))

    var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
    var pipeline = new Pipeline(configuration)

    var net = require('net')

    var asynchronous = new Asynchronous(pipeline.processors[0])

    var listener
    program.on('message', listener = function (message) {
        assert(message.module == 'prolific' && message.method == 'chunk')
        // TODO Consuming a message indicates we got an exit from stderr in the
        // parent, so we should trigger a shutdown.
        asynchronous.consume(message.body)
        destructible.destroy()
    })
    destructible.addDestructor('messages', function () {
        program.removeListener('message', listener)
    })

    async(function () {
        destructible.completed.wait(async())
    }, function () {
        return 0
    })

    async(function () {
        setImmediate(async()) // allows test to get handle
    }, [function () {
        destructible.destroy()
        pipeline.close(async())
    }], function () {
        pipeline.open(async())
    }, function () {
        var socket = new net.Socket({ fd: 3 })
        destructible.addDestructor('socket', socket, 'destroy')
        asynchronous.listen(socket, destructible.monitor('asynchronous'))

        program.send({ module: 'prolific', method: 'ready' })

        destructible.completed.wait(async())
    })
}))
