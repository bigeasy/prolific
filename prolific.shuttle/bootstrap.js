var prolific = require('prolific.sink')
var abend = require('abend')
var Isochronous = require('isochronous')
var assert = require('assert')
var slice = [].slice

exports.createShuttle = function (net, Shuttle) {
// TODO Is the interval necessary? Just flush constantly. Use Reactor (as heavy
// as Isochronous.)
    return function (program, finale) {
        assert(typeof finale != 'number', 'old shuttle invocation')
        var vargs = slice.call(arguments, 2)
        if (program.env.PROLIFIC_CONFIGURATION != null) {
// TODO Maybe delete and internalize?
            var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
            var pipe = new net.Socket({ fd: configuration.fd  })
            var shuttle = new Shuttle(pipe, pipe, program.stderr, finale, process)
            prolific.writer = shuttle.queue
// TODO Would love to be able to HUP this somehow.
            configuration.levels.forEach(function (level) {
                prolific.setLevel.apply(prolific, level)
            })
            vargs.forEach(function (signal) {
                program.on(signal, shuttle.stop.bind(shuttle))
            })
            program.on('uncaughtException', shuttle.uncaughtException.bind(shuttle))
            program.on('exit', shuttle.exit.bind(shuttle))
            return shuttle
        }
        return { stop: function () {} }
    }
}
