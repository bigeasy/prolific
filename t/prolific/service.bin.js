/*
    ___ usage ___ en_US ___
    usage: node service.bin.js

        -l, --log       <string>    the path or file descriptor of the log
            --help                  display this message

    ___ $ ___ en_US ___

        udp is required:
            the `--udp` address and port is a required argument

        port is not an integer:
            the `--udp` port must be an integer
    ___ ___ ___
*/

var dgram = require('dgram')
var children = require('child_process')
var Delta = require('delta')
var Queue = require('../../queue')
var prolific = require('../..')
var abend = require('abend')
var fs = require('fs')
var Staccato = require('staccato')

require('arguable')(module, require('cadence')(function (async, options) {
    options.helpIf(options.param.help)
    options.required('log')
    var logger = prolific.createLogger('prolific.service')
    process.on('uncaughtException', function (error) {
        logger.error('uncaught', { stack: error.stack })
        queue.flush(process.stderr, function (error) {
            abend(error)
            queue.flush(process.stderr, abend)
        })
    })
    var log = new Staccato(fs.createWriteStream(null, { fd: +options.param.log }), false)
    var queue = new Queue
    prolific.sink = queue
    logger.info('starting', { key: 'value' })
    async(function () {
        queue.flush(log, async())
    }, function () {
        throw new Error('uncaught')
    })
}))
