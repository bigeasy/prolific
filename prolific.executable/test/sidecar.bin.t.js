require('proof')(1, async (okay) => {
    const path = require('path')
    const stream = require('stream')
    const events = require('events')
    const fs = require('fs').promises

    const { Duplex } = require('duplicitous')

    const { once } = require('eject')

    const TMPDIR = path.join(__dirname, 'tmp')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
    }
    await (fs.rm || fs.rmdir).call(fs, TMPDIR, { force: true, recursive: true })
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

    const child = sidecar({ processor, supervisor: '1', tmp: TMPDIR, child: 3, main: __filename }, {
        $pipes: { 3: new Duplex },
        $stdin: stdin,
        process: messenger
    })
    const [ message ] = await once(messenger.parent, 'message').promise
    messenger.emit('message', {
        module: 'prolific',
        method: 'socket',
        body: null,
    })
    await new Promise(resolve => setImmediate(resolve))
    messenger.emit('message', {
        module: 'prolific',
        method: 'synchronous',
        body: null
    })
    await child.exit

    okay(test, [{
        module: 'prolific',
        method: 'receiving',
        child: 3
    }, {
        module: 'prolific',
        method: 'closed',
        child: 3
    }], 'test')
})
