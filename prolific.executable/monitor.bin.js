/*
    ___ usage ___ en_US ___
    usage: node monitor.bin.js

        -c, --configuration <string>    json configuration
            --help                      display this message

    ___ . ___
*/
require('arguable')(module, { properties: { net: require('net') } }, require('cadence')(function (async, program) {
    // Node.js API.
    var assert = require('assert')

    // Route messages through a process hierarchy using Node.js IPC.
    var Descendent = require('descendent')

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

    var descendent = new Descendent(program)

    var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
    var pipeline = new Pipeline(configuration)

    var net = require('net')

    var asynchronous = new Asynchronous(pipeline.processors[0])

    descendent.on('prolific:chunk', function (from, chunk) {
        asynchronous.consume(chunk)
        if (chunk.eos) {
            destructible.destroy()
            descendent.decrement()
        }
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
        var socket = new program.net.Socket({ fd: 3 })
        destructible.addDestructor('socket', socket, 'destroy')
        asynchronous.listen(socket, destructible.monitor('asynchronous'))

        descendent.up(0, 'prolific:ready', true)

        destructible.completed.wait(async())
    })
}))
