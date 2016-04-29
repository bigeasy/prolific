var cadence = require('cadence')
var prolific = require('prolific')
var abend = require('abend')
var Isochronous = require('isochronous')

exports.createShuttle =  function (net, Shuttle) {
    return cadence(function (async, program, interval, configuration, finale) {
        if (program.env.PROLIFIC_LOGGING_FD == null) {
            return null
        }
        var pipe = new net.Socket({ fd: +program.env.PROLIFIC_LOGGING_FD })
        var shuttle = new Shuttle(pipe, pipe, program.stderr, finale)
        async(function () {
            shuttle.open(configuration, async())
        }, function () {
            prolific.sink = shuttle.queue
            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            program.on('exit', shuttle.stop.bind(shuttle))
            var isochronous = new Isochronous({
                operation: { object: shuttle.sink, method: 'flush' },
                interval: interval,
                unref: true
            })
            program.on('exit', isochronous.stop.bind(isochronous))
            isochronous.run(abend)
            return [ shuttle.configuration ]
        })
    })
}
