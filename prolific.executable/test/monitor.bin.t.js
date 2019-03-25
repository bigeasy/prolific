require('proof')(3, require('cadence')(prove))

function prove (async, okay) {
    var monitor = require('../monitor.bin')
    var path = require('path')

    var delta = require('delta')

    var child = path.join(__dirname, 'program.js')

    var stream = require('stream')
    var util = require('util')

    var moudularized = require('./configuration')

    var stdin = new stream.PassThrough

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
        stdin.end()
    }]

    var Messenger = require('arguable/messenger')
    var messenger = new Messenger

    messenger.parent.on('message', function (message) {
        senders.shift()(message)
    })

    messenger.env = {}
    messenger.pid = 2

    async(function () {
        monitor({
            configuration: path.join(__dirname, 'configuration.js'),
            supervisor: '1'
        }, {
            $pipes: { 3: new stream.PassThrough },
            $stdin: stdin,
            process: messenger
        }, async())
    }, function (child) {
        child.exit(async())
    }, function (exitCode) {
        okay(exitCode, 0, 'ran')
    })
}
