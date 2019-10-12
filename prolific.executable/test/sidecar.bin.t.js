require('proof')(1, async (okay) => {
    const path = require('path')
    const stream = require('stream')
    const fs = require('fs').promises

    const Pipe = require('duplicitous/pipe')

    const rimraf = require('rimraf')
    const callback = require('prospective/callback')

    const TMPDIR = path.join(__dirname, 'tmp')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
    }
    await callback(callback => rimraf(TMPDIR, callback))
    await fs.mkdir(dir.publish, { recursive: true })
    await fs.mkdir(dir.stage, { recursive: true })
    const sidecar = require('../sidecar.bin')
    const stdin = new stream.PassThrough
    const Messenger = require('arguable/messenger')
    const messenger = new Messenger
    const test = []
    const processor = path.join(__dirname, 'processor.sidecar.js')

    const senders = [function (message) {
        const pid = message.path[0]
        message.path[0] = 2
    }, function (message) {
        const pid = message.path[0]
        message.path[0] = 2
        okay(message, {
            module: 'descendant',
            method: 'route',
            name: 'prolific:accept'
        }, 'accept message')
        // TODO Move the close to the part above to see that we hang on exit
        // with the current destructible. Need to decide what to do when
        // sidecar is called
        stdin.end()
    }]

    messenger.parent.on('message', (message) => {
        test.push(message)
    })

    messenger.env = {}
    messenger.pid = 2

    const pipe = new Pipe

    const child = sidecar({ processor, supervisor: '1', tmp: TMPDIR, child: 3, main: __filename }, {
        $pipes: { 3: pipe.server },
        $stdin: stdin,
        process: messenger
    })
    messenger.emit('message', {
        module: 'prolific',
        method: 'socket',
        body: null
    })
    await new Promise(resolve => setImmediate(resolve))
    messenger.emit('message', {
        module: 'prolific',
        method: 'synchronous',
        body: null
    })
    await child.promise

    okay(test, [{
        module: 'prolific',
        method: 'receiving',
        child: 3
    }], 'test')
})