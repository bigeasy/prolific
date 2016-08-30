var prolific = require('prolific.sink')
var abend = require('abend')
var Isochronous = require('isochronous')

exports.createShuttle = function (net, Shuttle) {
// TODO Is the interval necessary? Just flush constantly. Use Reactor (as heavy
// as Isochronous.)
    return function (program, interval, finale) {
        if (program.env.PROLIFIC_CONFIGURATION != null) {
// TODO Maybe delete and internalize?
            var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
            var pipe = new net.Socket({ fd: configuration.fd  })
            var shuttle = new Shuttle(pipe, pipe, program.stderr, finale, interval, process)
            prolific.writer = shuttle.queue
// TODO Would love to be able to HUP this somehow.
            configuration.levels.forEach(function (level) {
                prolific.setLevel.apply(prolific, level)
            })
            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            program.on('exit', shuttle.exit.bind(shuttle))
// TODO Not right. Want to stop queue before exiting, there might still be
// messages.
            program.on('SIGINT', shuttle.stop.bind(shuttle))
            program.on('SIGTERM', shuttle.stop.bind(shuttle))
            return shuttle
        }
        return { stop: function() {} }
    }
}
