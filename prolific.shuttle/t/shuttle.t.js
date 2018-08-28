require('proof')(6, prove)

function prove (okay) {
    var descendent = require('descendent')
    var Shuttle = require('..')
    var shuttle = new Shuttle
    var events = require('events')

    var stream = require('stream')

    var descendent = require('foremost')('descendent')

    descendent.process = new events.EventEmitter
    descendent.process.env = {
        PROLIFIC_SUPERVISOR_PROCESS_ID: '1',
        DESCENDENT_PROCESS_PATH: '1'
    }
    descendent.process.pid = 2
    descendent.process.stderr = new stream.PassThrough

    var sent = [ 'start message', 'start message again' ]
    descendent.process.connected = true
    descendent.process.send = function (message) {
        okay(message, {
            module: 'descendent',
            method: 'route',
            name: 'prolific:shuttle',
            to: [ 1 ],
            path: [ 2 ],
            body: 'H/2/0'
        }, sent.shift())
    }

    shuttle.start({
        uncaughtException: function (error) {
            okay(error.message, 'error', 'uncaught')
        },
        Date: { now: function () { return 0 } }
    })

    shuttle.start()

    okay(descendent.process.stderr.read().toString(),
        '% H/2/0 0 aaaaaaaa 811c9dc5 1\n' +
        '% H/2/0 1 811c9dc5 8b6ddbbf 53\n' +
        '{"headerId":"H/2/0","streamId":"S/2/0","path":[1,2]}\n'
    , 'stderr start')

    var pipe = new stream.PassThrough
    descendent.emit('prolific:pipe', {}, pipe)
    descendent.emit('prolific:accept', {
        body: {
            accept: true,
            chain: [],
            version: 1
        }
    })

    try {
        descendent.process.emit('uncaughtException', new Error('error'))
    } catch (e) {
        console.log(e.stack)
        console.log('caught')
    }

    // Already closed.
    shuttle.close()

    okay(descendent.process.stderr.read().toString(),
        '% S/2/0 0 aaaaaaaa 811c9dc5 1\n' +
        '% S/2/0 1 811c9dc5 c0c3ae50 16\n' +
        '[{"version":1}]\n'
    , 'stderr after close')

    shuttle = new Shuttle

    shuttle.start({ Date: { now: function () { return 0 } } })

    okay(descendent.process.stderr.read().toString(),
        '% H/2/0 0 aaaaaaaa 811c9dc5 1\n' +
        '% H/2/0 1 811c9dc5 8b6ddbbf 53\n' +
        '{"headerId":"H/2/0","streamId":"S/2/0","path":[1,2]}\n'
    , 'stderr start again')

    shuttle.close()

    shuttle = new Shuttle

    descendent.process.env = {}

    shuttle.start()
    shuttle.close()
}
