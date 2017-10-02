var Descendent = require('descendent')

var abend = require('abend')

var assert = require('assert')

exports.createShuttle = function (net, Shuttle, Date) {
    return function (program, finale, descendent) {
        if (program.env.PROLIFIC_CONFIGURATION != null) {
// TODO Maybe delete and internalize?
            var configuration = JSON.parse(program.env.PROLIFIC_CONFIGURATION)
            var shuttle
            if (configuration.fd == 'IPC') {
                var pid = program.pid + '/' + Date.now()
                shuttle = new Shuttle(pid, program.stderr, finale)
                // If we have to create our own `Descendent`, then we'll destroy
                // it the moment we get our pipe.
                var _descendent = descendent || new Descendent(program)
                _descendent.once('prolific:pipe', function (from, message, handle) {
                    shuttle.setPipe(handle, handle)
                    if (descendent == null) {
                        _descendent.destroy()
                    }
                })
                _descendent.up(0, 'prolific:monitor', pid)
            } else {
                shuttle = new Shuttle('0', program.stderr, finale)
                var pipe = new net.Socket({ fd: configuration.fd  })
                shuttle.setPipe(pipe, pipe)
            }
            var sink = require('prolific.resolver').sink
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
