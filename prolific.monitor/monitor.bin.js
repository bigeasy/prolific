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

var pumper = require('prolific.pumper')
var children = require('child_process')
var inherit = require('prolific.inherit')
var ipc = require('prolific.ipc')
var url = require('url')

require('arguable')(module, require('cadence')(function (async, program) {
    var configure = require('./configure')
    var nop = require('nop')

    program.helpIf(program.command.param.help)

    // Let child shtudown to shut us down.
    program.on('SIGINT', nop)
    program.on('SIGTERM', nop)

    var configuration = configure(program.env, program.command.param.configuration)

    var inheritance = inherit(program)
    configuration.fd = inheritance.fd

    var isProgram = require('./programmatic')
    var argv = program.argv.slice(), terminal = false
    var loop = async(function () {
        if (isProgram(program, terminal, argv)) {
            process.env.PROLIFIC_CONFIGURATION = JSON.stringify(configuration)
            var processors = configuration.processors.map(function (configuration) {
                var Processor = require(configuration.moduleName)
                return new Processor(configuration.parameters)
            })
            processors.reverse()
            var child = children.spawn(argv.shift(), argv, { stdio: inheritance.stdio })
            var io = { async: child.stdio[inheritance.fd], sync: child.stderr }
            ipc(program.command.param.ipc, process, child)
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
                pumper(processors, child, io, program.stderr, async())
            }, function (code) {
                return [ loop.break, code ]
            })
        } else {
            var command = argv.shift()
            var parser = require('prolific.' + command + '/' + command + '.argv')
            async(function () {
                parser(argv, async())
            }, function (processor) {
                configuration.processors.push(processor)
                argv = processor.argv
                terminal = processor.terminal
            })
        }
    })()
}))
