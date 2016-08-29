#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: node prolific.tcp.bin.js

        -i, --inherit   <number>        file handles to inherit
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
var inherit = require('prolific.inherit')
var ipc = require('prolific.ipc')
var url = require('url')

require('arguable')(module, require('cadence')(function (async, program) {
    var configure = require('./configure')
    var killer = require('./killer')

    program.helpIf(program.ultimate.help)

    var configuration = configure(program.env, program.ultimate.configuration)

    var inheritance = inherit(program)
    configuration.fd = inheritance.fd

    var isProgram = require('./programmatic')
    var argv = program.argv.slice(), terminal = false
    var loop = async(function () {
        program.assert(argv.length != 0, 'no program')
        var parser = isProgram(terminal, argv)
        if (parser == null) {
            process.env.PROLIFIC_CONFIGURATION = JSON.stringify(configuration)
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
                // Let child shtudown to shut us down.
                program.on('SIGINT', killer(child, 'SIGINT'))
                program.on('SIGTERM', killer(child, 'SIGTERM'))
                var io = { async: child.stdio[inheritance.fd], sync: child.stderr }
                ipc(program.ultimate.ipc, process, child)
                processors.push(nullProcessor)
                monitor(processors[0], child, io, program.stderr, async())
            }, function (code) {
                return [ loop.break, code ]
            })
        } else {
            async(function () {
                parser(argv, {
                    properties: { configuration: configuration }
                }, async())
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
