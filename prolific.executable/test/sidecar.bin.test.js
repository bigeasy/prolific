describe('sidecar', () => {
    const assert = require('assert')
    const path = require('path')
    const stream = require('stream')
    const fs = require('fs').promises
    const Pipe = require('duplicitous/pipe')

    it('can sidecar', async () => {
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
                module: 'descendent',
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

        messenger.env = {}
        messenger.pid = 2

        const pipe = new Pipe

        const child = sidecar({ configuration, supervisor: '1' }, {
            $pipes: { 3: pipe.server },
            $stdin: stdin,
            process: messenger
        })
        messenger.emit('message', {
            module: 'descendent',
            method: 'route',
            name: 'prolific:synchronous',
            to: [],
            path: [ 1, 2 ],
            body: null
        })
        await child.promise

        assert.deepStrictEqual(test, [{
            module: 'descendent',
            method: 'route',
            name: 'prolific:pipe',
            to: [ 1 ],
            path: [ 2 ],
            body: true
        }, {
            module: 'descendent',
            method: 'route',
            name: 'prolific:accept',
            to: [ 1 ],
            path: [ 2 ],
            body: { version: 0, file: configuration, source: await fs.readFile(configuration, 'utf8') }
        }], 'test')
    })
})
