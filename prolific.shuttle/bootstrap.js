var Descendent = require('descendent')
var Acceptor = require('prolific.acceptor')

var abend = require('abend')

var assert = require('assert')

exports.createShuttle = function (net, Shuttle, Date) {
    return function (program, finale) {
        if (program.env.PROLIFIC_SUPERVISOR_PROCESS_ID != null) {
            var monitorProcessId = +program.env.PROLIFIC_SUPERVISOR_PROCESS_ID
            var instanceId = program.pid + '/' + Date.now()

            // We create a descendent and pass it to the Shuttle so the Shuttle
            // can destroy it.
            // TODO Troubles me to create an extra descendent, feel like it
            // might be a good idea to split it into Up and Down. Down would
            // allow you to intercept messages and recall that they are
            // addressed, so they are not going to be given to a Descendent that
            // is not expecting them.
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
                sink.queue.push([{ version: message.body.version }])
            })
            descendent.up(monitorProcessId, 'prolific:monitor', instanceId)

            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            program.on('exit', shuttle.exit.bind(shuttle))
            return shuttle
        }
        return { close: function () {} }
    }
}
