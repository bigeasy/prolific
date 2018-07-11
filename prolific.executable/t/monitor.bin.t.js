require('proof')(2, require('cadence')(prove))

function prove (async, okay) {
    var monitor = require('../monitor.bin')
    var path = require('path')

    var delta = require('delta')

    var child = path.join(__dirname, 'program.js')
    var expectedExitCode = /^v0\.10\./.test(process.version) ? 143 : 0

    var Chunk = require('prolific.chunk')

    var stream = require('stream')
    var util = require('util')

    function Socket () {
        stream.PassThrough.call(this)
    }
    util.inherits(Socket, stream.PassThrough)


    Socket.prototype.destroy = function () {
    }

    var program
    async(function () {
        program = monitor([], {
            env: {
                PROLIFIC_CONFIGURATION: JSON.stringify({ processors:
                   [ { moduleName: 'prolific.test/test.processor',
                       parameters: { params: { key: 'value' } },
                       argv:
                        [ 'node',
                          '/Users/alan/git/ecma/prolific/prolific.root/t/program.js' ],
                       terminal: false } ],
                  levels: [],
                  fd: 'IPC',
                  configured: true
                })
            },
            send: function (message) {
                var pid = message.path[0]
                message.path[0] = 1
                okay(message, {
                    module: 'descendent',
                    method: 'route',
                    name: 'prolific:ready',
                    to: 0,
                    path: [ 1 ],
                    body: true
                }, 'message')
                program.emit('message', {
                    module: 'descendent',
                    method: 'route',
                    name: 'prolific:chunk',
                    to: [],
                    path: [ 1, pid ],
                    body: {
                        eos: false,
                        buffer: ''
                    }
                })
                program.emit('message', {
                    module: 'descendent',
                    method: 'route',
                    name: 'prolific:chunk',
                    to: [],
                    path: [ 1, pid ],
                    body: { eos: true }
                })
            },
            attributes: { net: { Socket: Socket } }
        }, async())
    }, function (code) {
        okay(code, 0, 'ran')
    })
}
