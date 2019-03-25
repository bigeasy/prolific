/*
    ___ usage ___ en_US ___
    usage: node monitor.bin.js

        -c, --configuration <string>    json configuration path
        -s, --supervisor <string>       pid of supervisor
            --help                      display this message

    ___ . ___
*/
require('arguable')(module, {
    $pipes: { 3: { readable: true } },
    $trap: { SIGINT: 'swallow', SIGTERM: 'swallow' },
    process: process
}, require('cadence')(function (async, destructible, arguable) {
    arguable.required('configuration', 'supervisor')

    // Node.js API.
    var assert = require('assert')

    // Route messages through a process hierarchy using Node.js IPC.
    var Descendent = require('descendent')

    var Signal = require('signal')
    var cadence = require('cadence')

    var Consolidator = require('prolific.consolidator')

    var descendent = require('foremost')('descendent')

    descendent.process = arguable.options.process
    descendent.increment()
    destructible.destruct.wait(descendent, 'decrement')

    var logger = require('prolific.logger').createLogger('prolific')
    function memoryUsage () { logger.notice('memory', process.memoryUsage()) }
    memoryUsage()
    var interval = setInterval(memoryUsage, 1000)
    destructible.destruct.wait(function () { clearInterval(interval) })

    var Processor = require('./processor')

    var Turnstile = require('turnstile')
    Turnstile.Queue = require('turnstile/queue')

    var cadence = require('cadence')

    async(function () {
        var reloaded = descendent.up.bind(descendent, +arguable.ultimate.supervisor, 'prolific:accept')
        destructible.durable('processor', Processor, arguable.ultimate.configuration, reloaded, async())
    }, function (processor) {
        // Drain all chunks immediately into a turnstile.
        var turnstile = new Turnstile
        var queue = new Turnstile.Queue(processor, 'process', turnstile)
        turnstile.listen(destructible.durable('turnstile'))
        destructible.destruct.wait(turnstile, 'destroy')

        arguable.stdin.resume()

        // Listen to our asynchronous pipe.
        var consolidator = new Consolidator(arguable.pipes[3], arguable.stdin, queue)

        consolidator.asynchronous(destructible.ephemeral('asynchronous'))
        consolidator.synchronous(destructible.ephemeral('synchronous'))

        destructible.destruct.wait(consolidator, 'exit')

        destructible.destruct.wait(arguable.pipes[3], 'destroy')

        // Let the supervisor know that we're ready. It will send our
        // asynchronous pipe down to the monitored process.
        descendent.up(+arguable.ultimate.supervisor, 'prolific:pipe', true)

        return []
    })
}))
