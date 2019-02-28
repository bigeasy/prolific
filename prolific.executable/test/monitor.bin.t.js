require('proof')(3, require('cadence')(prove))

function prove (async, okay) {
    var monitor = require('../monitor.bin')
    var path = require('path')

    var delta = require('delta')

    var child = path.join(__dirname, 'program.js')

    var Chunk = require('prolific.chunk')

    var stream = require('stream')
    var util = require('util')

    function Socket () {
        stream.PassThrough.call(this)
    }
    util.inherits(Socket, stream.PassThrough)


    Socket.prototype.destroy = function () {
        this.end()
    }

    var moudularized = require('./configuration')

    var senders = [function (message) {
        var pid = message.path[0]
        message.path[0] = 2
        okay(message, {
            module: 'descendent',
            method: 'route',
            name: 'prolific:pipe',
            to: [ 1 ],
            path: [ 2 ],
            body: true
        }, 'pipe message')
    }, function (message) {
        var pid = message.path[0]
        message.path[0] = 2
        okay(message, {
            module: 'descendent',
            method: 'route',
            name: 'prolific:accept',
            to: [ 1 ],
            path: [ 2 ],
            body: { version: 0, triage: moudularized.triage.toString() }
        }, 'accept message')
        // TODO Move the close to the part above to see that we hang on exit
        // with the current destructible. Need to decide what to do when monitor
        // is called
        program.stdin.end(JSON.stringify({
            eos: true,
            buffer: ''
        }) + '\n')
    }]

    var program
    async(function () {
        program = monitor({
            configuration: path.join(__dirname, 'configuration.js'),
            supervisor: '1'
        }, {
            send: function (message) {
                senders.shift().call(null, message)
            },
            attributes: { net: { Socket: Socket } }
        }, async())
    }, function (code) {
        okay(code, 0, 'ran')
    })
}
