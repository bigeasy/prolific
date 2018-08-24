var Descendent = require('descendent')
var Acceptor = require('prolific.acceptor')
var foremost = require('foremost')

var abend = require('abend')

var assert = require('assert')

exports.createShuttle = function (Shuttle, Date) {
    return function (finale) {
        var descendent = foremost('descendent')
        var program = descendent.process
        if (program.env.PROLIFIC_SUPERVISOR_PROCESS_ID != null) {
            var monitorProcessId = +program.env.PROLIFIC_SUPERVISOR_PROCESS_ID
            var instanceId = 'H/' + program.pid + '/' + Date.now()

            descendent.increment()
            var shuttle = new Shuttle(instanceId, program.stderr, finale, descendent)

            // All filtering will be performed by the monitor initially. Until
            // we get a configuration we send everything.
            var sink = require('prolific.resolver').sink
            sink.queue = shuttle.queue
            sink.acceptor = new Acceptor(true, [])

            descendent.once('prolific:pipe', function (message, handle) {
                shuttle.setPipe(handle, handle)
            })
            descendent.on('prolific:accept', function (message) {
                sink.acceptor = new Acceptor(message.body.accept, message.body.chain)
                sink.queue.push([{ version: message.body.version }])
            })
            descendent.up(monitorProcessId, 'prolific:monitor', instanceId)

            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            // TODO Isn't this a bit dubious? Let's force caller to close.
            program.on('exit', shuttle.exit.bind(shuttle))
            return shuttle
        }
        return { close: function () {} }
    }
}
