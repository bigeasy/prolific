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

    var Signal = require('signal')
    var cadence = require('cadence')

    var Consolidator = require('prolific.consolidator')

    var descendent = require('foremost')('descendent')

    var destructible = new Destructible(4000, 'prolific.monitor')

    descendent.process = program
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')

    var logger = require('prolific.logger').createLogger('prolific')
    function memoryUsage () { logger.notice('memory', process.memoryUsage()) }
    memoryUsage()
    setInterval(memoryUsage, 1000).unref()

    var Processor = require('./processor')

    var Turnstile = require('turnstile')
    Turnstile.Queue = require('turnstile/queue')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    process.on('SIGINT', function () {})
    process.on('SIGTERM', function () {})

    // TODO Goodness this is silly. Just add a signal to arugable. Or maybe just
    // use `process` now that it has settled.
    destructible.destruct.wait(destructible.durable('exit').bind(null, null, 0))

    cadence(function (async) {
        async([function () {
            program.ready.unlatch()
        }], function () {
            setImmediate(async()) // allows test to get handle
        }, function () {
            var reloaded = descendent.up.bind(descendent, +program.ultimate.supervisor, 'prolific:accept')
            destructible.durable('processor', Processor, program.ultimate.configuration, reloaded, async())
        }, function (processor) {
            // Drain all chunks immediately into a turnstile.
            var turnstile = new Turnstile
            var queue = new Turnstile.Queue(processor, 'process', turnstile)
            turnstile.listen(destructible.durable('turnstile'))
            destructible.destruct.wait(turnstile, 'destroy')

            program.stdin.resume()

            // Listen to our asynchronous pipe.
            var socket = new program.attributes.net.Socket({ fd: 3, readable: true })
            var consolidator = new Consolidator(socket, program.stdin, queue)

            consolidator.asynchronous(destructible.ephemeral('asynchronous'))
            consolidator.synchronous(destructible.ephemeral('synchronous'))

            destructible.destruct.wait(consolidator, 'exit')

            destructible.destruct.wait(socket, 'destroy')

            // Let the supervisor know that we're ready. It will send our
            // asynchronous pipe down to the monitored process.
            descendent.up(+program.ultimate.supervisor, 'prolific:pipe', true)
        })
    })(destructible.ephemeral('initialize'))
}, { net: require('net') })
