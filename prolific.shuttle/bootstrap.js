var prolific = require('prolific')
var abend = require('abend')
var Isochronous = require('isochronous')

exports.createShuttle = function (net, Shuttle) {
// TODO Is the interval necessary? Just flush constantly. Use Reactor (as heavy
// as Isochronous.)
    return function (program, interval, parameters, finale) {
        if (arguments.length == 3) {
            finale = parameters
            parameters = {}
        }
        if (program.env.PROLIFIC_CONFIGURATION != null) {
// TODO Maybe delete and internalize?
            var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
            var pipe = new net.Socket({ fd: configuration.fd  })
            var shuttle = new Shuttle(pipe, pipe, program.stderr, finale, interval)
            shuttle.queue.write(new Buffer(JSON.stringify(parameters) + '\n'))
            prolific.sink = shuttle.queue
            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            program.on('exit', shuttle.stop.bind(shuttle))
            program.on('SIGINT', shuttle.stop.bind(shuttle))
            program.on('SIGTERM', shuttle.stop.bind(shuttle))
        }
    }
}
