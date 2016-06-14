require('proof')(1, prove)

function prove (assert) {
    var events = require('events')
    var bootstrap = require('../bootstrap')
    var program = new events.EventEmitter
    program.env = { PROLIFIC_CONFIGURATION: JSON.stringify({ fd: 3 }) }
    var net = {
        Socket: function (options) {
            assert(options, { fd: 3 }, 'socket')
        }
    }
    function Shuttle () {
        this.queue = {}
        this.uncaughtException = function () {}
        this.stop = function () {}
        this.exit = function () {}
    }
    var createShuttle = bootstrap.createShuttle(net, Shuttle)
    createShuttle({ env: {} })
    createShuttle(program, 1000, function () {})
}
