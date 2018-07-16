var Descendent = require('descendent')
var Acceptor = require('prolific.acceptor')

var abend = require('abend')

var assert = require('assert')

exports.createShuttle = function (net, Shuttle, Date) {
    return function (program, finale) {
        if (program.env.PROLIFIC_MONITOR_PID != null) {
            var monitorProcessId = +program.env.PROLIFIC_MONITOR_PID
            var instanceId = program.pid + '/' + Date.now()

            var descendent = new Descendent(program)
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
                sink.queue.push([{ acceptor: message.body.version }])
            })
            descendent.up(monitorProcessId, 'prolific:monitor', instanceId)

            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            program.on('exit', shuttle.exit.bind(shuttle))
            return shuttle
        }
        return { close: function () {} }
    }
}
