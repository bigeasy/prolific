require('proof')(4, require('cadence')(prove))

function prove (async, assert) {
    var events = require('events')
    var ipc = require('..')

    ipc(false, null, null)

    async(function () {
        var process = new events.EventEmitter
        process.send = function (message) {
            assert(message, { from: 'child' }, 'process send')
            wait()
        }
        process.versions = { node: '0.10.43' }
        var child = new events.EventEmitter
        child.send = function (message) {
            assert(message, { from: 'parent' }, 'child send')
            child.emit('message', { from: 'child' })
        }
        var wait = async()

        ipc(true, process, child)

        process.emit('message', { from: 'parent' })
    }, function () {
        var process = new events.EventEmitter
        process.send = function (message, callback) {
            assert(message, { from: 'child' }, 'process send')
            callback()
            wait()
        }
        process.versions = { node: '4.2.3' }
        process.connected = true
        process.disconnect = function () { this.connected = false }
        var child = new events.EventEmitter
        child.send = function (message, callback) {
            assert(message, { from: 'parent' }, 'child send')
            child.emit('message', { from: 'child' })
            callback()
        }
        var wait = async()

        ipc(true, process, child)

        process.emit('message', { from: 'parent' })

        process.emit('SIGINT')
        process.emit('SIGINT')
    })
}
