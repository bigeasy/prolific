#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: node prolific.tcp.bin.js

        -i, --inherit   <number>        file handles to inherit
        -c, --cluster                   run in cluster mode
        -I, --ipc                       enable Node.js IPC forwarding
            --configuration <string>    base configuration JSON or environment variable
            --help                      display this message

    ___ $ ___ en_US ___

        log is required:
            the `--log` address and port is a required argument

        port is not an integer:
            the `--log` port must be an integer

    ___ . ___
*/

var monitor = require('prolific.monitor')
var children = require('child_process')
var cadence = require('cadence')
var inherit = require('prolific.inherit')
var ipc = require('prolific.ipc')
var url = require('url')
var Pipeline = require('./pipeline')

var direct = cadence(function (async, program, configuration, argv, inheritance) {
    var killer = require('./killer')
    var pipeline = new Pipeline(configuration)
    var initialized = []
    async([function () {
        pipeline.close(async())
    }], function () {
        pipeline.open(async())
    }, function () {
        var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
        // If you `ctl+c` from your shell, you're going to get doubles.
        program.on('SIGINT', killer(child, 'SIGINT'))
        program.on('SIGTERM', killer(child, 'SIGTERM'))
        var io = { async: child.stdio[inheritance.fd], sync: child.stderr }
        ipc(program.ultimate.ipc, process, child)
        monitor(pipeline.processors[0], child, io, program.stderr, async())
    }, function (code) {
        return [ code ]
    })
})

var clustered = cadence(function (async, configuration) {
    var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
    child.on('message', function (message) {
        var prolific = children.spawn(node, [ 'monitor.bin.js' ], {
            stdio: [ 'inherit', 'inherit', 'inherit', 'pipe', 'pipe' ]
        })
        child.send('message', {
            module: 'prolific',
            method: 'socket'
        }, prolific.stdio[3])
    })
})

require('arguable')(module, require('cadence')(function (async, program) {
    var configure = require('./configure')

    if (program.ultimate.cluster) {
        program.ultimate.ipc = true
    }

    program.helpIf(program.ultimate.help)

    var configuration = configure(program.env, program.ultimate.configuration)

    // TODO `inherit` skips write fd if cluster
    var inheritance = inherit(program)
    configuration.fd = program.ultimate.cluster ? 'IPC' : inheritance.fd
    async(function () {
        Pipeline.parse(program, configuration, async())
    }, function (configuration, argv) {
        process.env.PROLIFIC_CONFIGURATION = JSON.stringify(configuration)
        async(function () {
            if (program.ultimate.cluster) {
                clustered(configuration, argv, async())
            } else {
                direct(program, configuration, argv, inheritance, async())
            }
        }, function (code) {
            // TODO We don't do it like this anymore.
            return [ code ]
        })
    })
}))
