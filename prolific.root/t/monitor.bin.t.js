require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var monitor = require('../monitor.bin')
    var path = require('path')

    var delta = require('delta')

    var child = path.join(__dirname, 'program.js')
    var expectedExitCode = /^v0\.10\./.test(process.version) ? 143 : 0

    var Chunk = require('prolific.chunk')

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
                assert(message, { module: 'prolific', method: 'ready' }, 'message')
                program.emit('message', {
                    module: 'prolific',
                    method: 'chunk',
                    body: { eos: true }
                })
            }
        }, async())
    }, function (code) {
        assert(code, 0, 'ran')
    })
}
