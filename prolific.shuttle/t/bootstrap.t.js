require('proof/redux')(1, prove)

function prove (assert) {
    var events = require('events')
    var bootstrap = require('../bootstrap')
    var program = new events.EventEmitter
    program.env = { PROLIFIC_CONFIGURATION: JSON.stringify({ levels: [['TRACE']], fd: 3 }) }
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
    createShuttle(program, function () {}, 'SIGINT')
    createShuttle({ env: {} }, function () {}).stop()
}
