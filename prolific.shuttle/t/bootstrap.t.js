require('proof')(1, prove)

function prove (assert) {
    var events = require('events')
    var bootstrap = require('../bootstrap')
    var net = {
        Socket: function (options) {
            assert(options, { fd: 3 }, 'socket')
        }
    }
    function Shuttle () {
        this.queue = { write: function () {} }
        this.uncaughtException = function () {}
        this.stop = function () {}
    }
    var program = new events.EventEmitter
    var createShuttle = bootstrap.createShuttle(net, Shuttle)
    createShuttle({ env: {} })
    program.env = { PROLIFIC_CONFIGURATION: JSON.stringify({ fd: 3 }) }
    createShuttle(program, 1000, {}, function () {})
}
