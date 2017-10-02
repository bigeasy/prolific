require('proof')(2, prove)

function prove (okay) {
    var events = require('events')
    var stream = require('stream')
    var bootstrap = require('../bootstrap')
    var program = new events.EventEmitter
    program.env = { PROLIFIC_CONFIGURATION: JSON.stringify({ levels: [['TRACE']], fd: 3 }) }
    program.send = function (message) {
        okay(message, {
            module: 'descendent',
            name: 'prolific:monitor',
            to: 0,
            path: [ 1 ],
            body: '1/0'
        }, 'request')
        program.emit('message', {})
        program.emit('message', {
            module: 'descendent',
            name: 'prolific:pipe',
            to: [],
            path: [ 0, 1 ],
            body: true
        }, new stream.PassThrough)
    }
    program.pid = 1
    var net = {
        Socket: function (options) {
            okay(options, { fd: 3 }, 'socket')
        }
    }
    function Shuttle () {
        this.queue = {}
        this.uncaughtException = function () {}
        this.close = function () {}
        this.exit = function () {}
        this.setPipe = function () {}
    }
    var createShuttle = bootstrap.createShuttle(net, Shuttle, { now: function () { return 0 } })
    createShuttle(program, function () {})
    program.env = { PROLIFIC_CONFIGURATION: JSON.stringify({ levels: [['TRACE']], fd: 'IPC' }) }
    createShuttle(program, function () {})
    createShuttle({ env: {} }, function () {}).close()
}
