var sink = require('prolific.sink')
var abend = require('abend')
var assert = require('assert')
var slice = [].slice

exports.createShuttle = function (net, Shuttle) {
    return function (program, finale) {
        assert(arguments.length == 2, 'old shuttle invocation')
        if (program.env.PROLIFIC_CONFIGURATION != null) {
// TODO Maybe delete and internalize?
            var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
            var pipe = new net.Socket({ fd: configuration.fd  })
            var shuttle = new Shuttle(pipe, pipe, program.stderr, finale, process)
            sink.queue = shuttle.queue
// TODO Would love to be able to HUP this somehow.
            configuration.levels.forEach(function (level) {
                sink.setLevel.apply(sink, level)
            })
            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            program.on('exit', shuttle.exit.bind(shuttle))
            return shuttle
        }
        return { close: function () {} }
    }
}
