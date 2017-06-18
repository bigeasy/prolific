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

    console.log('CAN YOU HEAR ME?')

    var finalized = new Signal

    var listener
    program.on('message', listener = function (message) {
        assert(message.module == 'prolific' && message.method == 'chunk')
        console.log('FINAL CHUNK', message)
        asynchronous.consume(message.body)
        finalized.unlatch()
    })
    destructible.addDestructor('messages', function () {
        program.removeListener('message', listener)
    })

    program.on('shutdown', destructible.destroy.bind(destructible))
    program.on('shutdown', function () {
        console.log('GOT SHUTDOWN')
    })

    async(function () {
        setImmediate(async()) // allows test to get handle
    }, [function () {
        pipeline.close(async())
    }], function () {
        pipeline.open(async())
    }, function () {
        thereafter.run(function (ready) {
            console.log('async')
            cadence(function () {
                var socket = new net.Socket({ fd: 3 })
                destructible.addDestructor('socket_x', function () {
                    console.log('destroying socket')
                })
                destructible.addDestructor('socket', socket, 'destroy')
                destructible.addDestructor('socket_x', function () {
                    console.log('socket would be destroyed by now')
                })
                async(function () {
                    asynchronous.listen(socket, async())
                    ready.unlatch()
                }, function () {
                    finalized.wait(5000, async())
                })
            })(destructible.monitor('asynchronous'))
        })
        thereafter.run(function (ready) {
            console.log('ready')
            program.send({ module: 'prolific', method: 'ready' })
            ready.unlatch()
        })
        destructible.completed(3000, async())
    }, function () {
        console.log('monitor done')
        return 0
    })
}))
