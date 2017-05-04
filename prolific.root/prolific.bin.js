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

var direct = cadence(function (async, program, configuration, argv, inheritance) {
    var killer = require('./killer')
    var nullProcessor = { process: function () {} }, nextProcessor = nullProcessor
    var processors = configuration.processors.map(function (configuration) {
        var Processor = require(configuration.moduleName)
        return nextProcessor = new Processor(configuration.parameters, nextProcessor)
    })
    processors.reverse()
    var initialized = []
    async([function () {
        async.forEach(function (processor) {
            processor.close(async())
        })(initialized)
    }], function () {
        async.forEach(function (processor) {
            async(function () {
                processor.open(async())
            }, function () {
                initialized.push(processor)
            })
        })(processors)
    }, function () {
        var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
        // If you `ctl+c` from your shell, you're going to get doubles.
        program.on('SIGINT', killer(child, 'SIGINT'))
        program.on('SIGTERM', killer(child, 'SIGTERM'))
        var io = { async: child.stdio[inheritance.fd], sync: child.stderr }
        ipc(program.ultimate.ipc, process, child)
        processors.push(nullProcessor)
        monitor(processors[0], child, io, program.stderr, async())
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

    var commandable = require('./commandable')
    var argv = program.argv.slice(), terminal = false
    var loop = async(function () {
        program.assert(argv.length != 0, 'no program')
        var parser = commandable(terminal, argv)
        if (parser == null) {
            process.env.PROLIFIC_CONFIGURATION = JSON.stringify(configuration)
            async(function () {
                if (program.ultimate.cluster) {
                    clustered(configuration, argv, async())
                } else {
                    direct(program, configuration, argv, inheritance, async())
                }
            }, function (code) {
                return [ loop.break, code ]
            })
        } else {
            async(function () {
                parser(argv, {}, configuration, async())
            }, function (processor) {
                if (processor.moduleName) {
                    configuration.processors.push(processor)
                }
                argv = processor.argv
                terminal = processor.terminal
            })
        }
    })()
}))
