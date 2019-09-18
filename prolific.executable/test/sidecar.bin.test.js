describe('sidecar', function () {
    this.timeout(10000)
    const assert = require('assert')
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
    it('can sidecar', async () => {
        await callback(callback => rimraf(TMPDIR, callback))
        await fs.mkdir(dir.publish, { recursive: true })
        await fs.mkdir(dir.stage, { recursive: true })
        const sidecar = require('../sidecar.bin')
        const stdin = new stream.PassThrough
        const Messenger = require('arguable/messenger')
        const messenger = new Messenger
        const test = []
        const configuration = path.join(__dirname, 'configuration.sidecar.js')

        const senders = [function (message) {
            const pid = message.path[0]
            message.path[0] = 2
        }, function (message) {
            const pid = message.path[0]
            message.path[0] = 2
            assert.deepStrictEqual(message, {
                module: 'descendant',
                method: 'route',
                name: 'prolific:accept',
            }, 'accept message')
            // TODO Move the close to the part above to see that we hang on exit
            // with the current destructible. Need to decide what to do when
            // sidecar is called
            stdin.end()
        }]

        messenger.parent.on('message', (message) => {
            console.log(message)
            test.push(message)
        })

        messenger.env = { PROLIFIC_TMPDIR: TMPDIR }
        messenger.pid = 2

        const pipe = new Pipe

        const child = sidecar({ configuration, supervisor: '1' }, {
            $pipes: { 3: pipe.server },
            $stdin: stdin,
            process: messenger
        })
        messenger.emit('message', {
            module: 'descendant',
            method: 'route',
            name: 'prolific:synchronous',
            to: [],
            path: [ 1, 2 ],
            body: null
        })
        await child.promise

        assert.deepStrictEqual(test, [{
            module: 'descendant',
            method: 'route',
            name: 'prolific:receiving',
            to: [ 1 ],
            path: [ 2 ],
            body: process.pid
        }], 'test')
    })
})
