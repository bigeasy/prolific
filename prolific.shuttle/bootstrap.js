var fs = require('fs')
var cadence = require('cadence')
var prolific = require('prolific')
var abend = require('abend')
var Isochronous = require('isochronous')

exports.createShuttle = function (net, Shuttle) {
    return function (program, interval, finale) {
        if (program.env.PROLIFIC_LOGGING_FD != null) {
            var fd = +program.env.PROLIFIC_LOGGING_FD
            var pipe = new net.Socket({ fd: fd  })
            var shuttle = new Shuttle(pipe, pipe, program.stderr, finale)
            prolific.sink = shuttle.queue
            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            program.on('exit', shuttle.stop.bind(shuttle))
            var isochronous = new Isochronous({
                operation: { object: shuttle.queue, method: 'flush' },
                interval: interval,
                unref: true
            })
            program.on('exit', isochronous.stop.bind(isochronous))
            isochronous.run(abend)
        }
    }
}
