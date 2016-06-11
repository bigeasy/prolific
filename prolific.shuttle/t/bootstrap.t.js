require('proof')(4, prove)

function test (assert, prefix, written) {
    var events = require('events')
    var bootstrap = require('../bootstrap')
    var net = {
        Socket: function (options) {
            assert(options, { fd: 3 }, prefix + 'socket')
        }
    }
    function Shuttle () {
        this.queue = {
            write: function (value) {
                assert(value.toString(), written, prefix + 'init')
            }
        }
        this.uncaughtException = function () {}
        this.stop = function () {}
    }
    var createShuttle = bootstrap.createShuttle(net, Shuttle)
    createShuttle({ env: {} })
    return createShuttle
}

function prove (assert) {
    var createShuttle
    var events = require('events')
    var program = new events.EventEmitter
    program.env = { PROLIFIC_CONFIGURATION: JSON.stringify({ fd: 3 }) }
    createShuttle = test(assert, '', '{"a":1}\n')
    createShuttle({ env: {} })
    createShuttle(program, 1000, { a: 1 }, function () {})
    createShuttle = test(assert, 'no init ', '{}\n')
    createShuttle(program, 1000, function () {})
}
