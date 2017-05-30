var sink = require('prolific.sink')
var abend = require('abend')
var assert = require('assert')
var slice = [].slice

exports.createShuttle = function (net, Shuttle, Date) {
    return function (program, finale) {
        assert(arguments.length == 2, 'old shuttle invocation')
        if (program.env.PROLIFIC_CONFIGURATION != null) {
// TODO Maybe delete and internalize?
            var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
            var shuttle
            if (configuration.fd == 'IPC') {
                var pid = program.pid + '/' + Date.now(), handle
                shuttle = new Shuttle(pid, program.stderr, finale)
                program.on('message', handle = function (message, pipe) {
                    if (message.module == 'prolific' && message.method == 'socket' && message.pid == pid) {
                        shuttle.setPipe(pipe, pipe)
                        program.removeListener('message', handle)
                    }
                })
                program.send({ module: 'prolific', method: 'monitor', pid: pid })
            } else {
                shuttle = new Shuttle('0', program.stderr, finale)
                var pipe = new net.Socket({ fd: configuration.fd  })
                shuttle.setPipe(pipe, pipe)
            }
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
