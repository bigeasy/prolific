/*
    ___ usage ___ en_US ___
    usage: node monitor.bin.js

        -c, --configuration <string>    json configuration path
        -s, --supervisor <string>       pid of supervisor
            --help                      display this message

    ___ . ___
*/
require('arguable')(module, function (program, callback) {
    program.required('configuration', 'supervisor')

    // Node.js API.
    var assert = require('assert')

    // Route messages through a process hierarchy using Node.js IPC.
    var Descendent = require('descendent')

    // Controlled demolition of objects.
    var Destructible = require('destructible')

    // Consolidate chunks from async and sync streams.
    var Asynchronous = require('prolific.consolidator/asynchronous')

    var Signal = require('signal')
    var cadence = require('cadence')

    var descendent = require('foremost')('descendent')

    var destructible = new Destructible(4000, 'prolific.monitor')
    program.on('shutdown', destructible.destroy.bind(destructible))

    descendent.process = program
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')

    var Processor = require('./processor')

    var Turnstile = require('turnstile')
    Turnstile.Queue = require('turnstile/queue')

    destructible.completed.wait(callback)

    var reader = require('./stdin')(destructible.destroy.bind(destructible))

    var cadence = require('cadence')

    destructible.destruct.wait(destructible.monitor('exit').bind(null, null, 0))

    cadence(function (async) {
        async([function () {
            program.ready.unlatch()
        }], function () {
            setImmediate(async()) // allows test to get handle
        }, function () {
            var reloaded = descendent.up.bind(descendent, +program.ultimate.supervisor, 'prolific:accept')
            destructible.monitor('processor', Processor, program.ultimate.configuration, reloaded, async())
        }, function (processor) {
            // Drain all chunks immediately into a turnstile.
            var turnstile = new Turnstile
            var queue = new Turnstile.Queue(processor, 'process', turnstile)
            turnstile.listen(destructible.monitor('turnstile'))
            destructible.destruct.wait(turnstile, 'destroy')

            // Create our asynchronous listener that reads directly from the
            // monitored process.
            var asynchronous = new Asynchronous(queue)

            // Copy any final messages written to standard error into the
            // asynchronous listener so it can eliminate any duplicates that
            // where already written to our primary asynchronous pipe.
            reader(program.stdin, asynchronous, destructible.monitor('stdin'))
            program.stdin.resume()

            // Listen to our asynchronous pipe.
            var socket = new program.attributes.net.Socket({ fd: 3 })
            destructible.destruct.wait(socket, 'destroy')
            asynchronous.listen(socket, destructible.monitor('asynchronous'))

            // Let the supervisor know that we're ready. It will send our
            // asynchronous pipe down to the monitored process.
            descendent.up(+program.ultimate.supervisor, 'prolific:pipe', true)
        })
    })(destructible.monitor('initialize', true))
}, { net: require('net') })
