var prolific = require('prolific')
var abend = require('abend')
var Isochronous = require('isochronous')

exports.createShuttle = function (net, Shuttle) {
    return function (program, interval, configuration, finale) {
        if (program.env.PROLIFIC_CONFIGURATION != null) {
// TODO Maybe delete and internalize?
            var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
            var pipe = new net.Socket({ fd: configuration.fd  })
            var shuttle = new Shuttle(pipe, pipe, program.stderr, finale)
            shuttle.queue.write(new Buffer(JSON.stringify(configuration) + '\n'))
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
