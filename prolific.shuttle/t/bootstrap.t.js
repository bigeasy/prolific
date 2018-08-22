require('proof')(1, prove)

function prove (okay) {
    var events = require('events')
    var stream = require('stream')
    var bootstrap = require('../bootstrap')
    var program = new events.EventEmitter
    require('descendent').process = program
    program.send = function (message) {
        okay(message, {
            module: 'descendent',
            method: 'route',
            name: 'prolific:monitor',
            to: [ 1 ],
            path: [ 1 ],
            body: '1/0'
        }, 'monitor')
        program.emit('message', {})
        program.emit('message', {
            module: 'descendent',
            method: 'route',
            name: 'prolific:pipe',
            to: [],
            path: [ 0, 1 ],
            body: true
        }, new stream.PassThrough)
        program.emit('message', {
            module: 'descendent',
            method: 'route',
            name: 'prolific:accept',
            to: [],
            path: [ 0, 1 ],
            body: {
                version: 1,
                accept: true,
                chain: []
            }
        }, new stream.PassThrough)
    }
    program.pid = 1
    var net = {
        Socket: function (options) {
            okay(options, { fd: 3 }, 'socket')
        }
    }
    function Shuttle () {
        this.queue = []
        this.uncaughtException = function () {}
        this.close = function () {}
        this.exit = function () {}
        this.setPipe = function () {}
    }
    var createShuttle = bootstrap.createShuttle(net, Shuttle, { now: function () { return 0 } })
    program.env = { PROLIFIC_SUPERVISOR_PROCESS_ID: '1' }
    createShuttle(function () {})
    program.env = {}
    createShuttle(function () {}).close()
}
