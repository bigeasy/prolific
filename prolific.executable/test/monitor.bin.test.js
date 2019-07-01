describe('monitor', () => {
    const assert = require('assert')
    const path = require('path')
    const stream = require('stream')
    const fs = require('fs').promises

    it('can monitor', async () => {
        const monitor = require('../monitor.bin')
        const stdin = new stream.PassThrough
        const Messenger = require('arguable/messenger')
        const messenger = new Messenger
        const test = []
        const configuration = path.join(__dirname, 'configuration.monitor.js')

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
            // with the current destructible. Need to decide what to do when monitor
            // is called
            stdin.end()
        }]

        messenger.parent.on('message', (message) => {
            test.push(message)
        })

        messenger.env = {}
        messenger.pid = 2

        const child = monitor({ configuration, supervisor: '1' }, {
            $pipes: { 3: new stream.PassThrough },
            $stdin: stdin,
            process: messenger
        })
        stdin.end()
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
