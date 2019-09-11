describe('watcher', () => {
    const assert = require('assert')
    const rimraf = require('rimraf')
    const path = require('path')
    const fs = require('fs').promises
    const callback = require('prospective/callback')
    const once = require('prospective/once')
    const sink = require('foremost')('prolific.sink')
    const events = require('events')
    const entries = new events.EventEmitter
    const TMPDIR = path.join(__dirname, 'tmp')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
    }
    process.on('unhandledRejection', error => { throw error })
    async function reset () {
        await callback(callback => rimraf(TMPDIR, callback))
        await fs.mkdir(dir.publish, { recursive: true })
        await fs.mkdir(dir.stage, { recursive: true })
        // For some reason we need to wait a bit for the above directories to
        // actually take effect on OS X, otherwise files from previous run are
        // extant and the first events are reporting a missing file.
        await new Promise(resolve => setTimeout(resolve, 50))
        const Watcher = require('..')
        const Destructible = require('destructible')
        const destructible = new Destructible(__filename)
        const watcher = new Watcher(destructible, () => 0, path.join(TMPDIR, 'publish'))
        return { destructible, watcher }
    }
    class Notice {
        constructor (watcher, label) {
            const log = []
            this.promise = new Promise(resolve => {
                function notice (entry) {
                    log.push(entry)
                    watcher.removeListener('notice', notice)
                    if (entry.label == label) {
                        resolve(log)
                    }
                }
                watcher.on('notice', notice)
            })
        }
    }
    it('can watch and parse a directory', async () => {
        const { watcher, destructible } = await reset()
        const data = once(watcher, 'data').promise
        const notice = new Notice(watcher, 'read')
        await fs.writeFile(path.join(dir.stage, 'stage.json'), '1')
        await fs.rename(path.join(dir.stage, 'stage.json'),
                        path.join(dir.publish, 'publish-00000000.json'))
        const [ json ] = await data
        assert.equal(json, 1, 'received')
        const log = await notice.promise
        destructible.destroy()
        await destructible.promise
        assert.deepStrictEqual(log.map(entry => entry.label), [ 'read' ], 'read')
    })
    it('can detect a bad file name', async () => {
        const { watcher, destructible } = await reset()
        const notice = new Notice(watcher, 'filename')
        await fs.writeFile(path.join(dir.stage, 'stage.json'), '1')
        await fs.rename(path.join(dir.stage, 'stage.json'),
                        path.join(dir.publish, 'publish.json'))
        const log = await notice.promise
        destructible.destroy()
        assert.deepStrictEqual(log.map(entry => entry.label), [ 'filename' ], 'filename error')
    })
    it('can detect a bad checksum', async () => {
        const { watcher, destructible } = await reset()
        const notice = new Notice(watcher, 'checksum')
        await fs.writeFile(path.join(dir.stage, 'stage.json'), '1')
        await fs.rename(path.join(dir.stage, 'stage.json'),
                        path.join(dir.publish, 'publish-1.json'))
        const log = await notice.promise
        destructible.destroy()
        await destructible.promise
        assert.deepStrictEqual(log.map(entry => entry.label), [ 'checksum' ], 'checksum error')
    })
    it('can detect bad json', async () => {
        const { watcher, destructible } = await reset()
        const notice = new Notice(watcher, 'json')
        await fs.writeFile(path.join(dir.stage, 'stage.json'), '{')
        await fs.rename(path.join(dir.stage, 'stage.json'),
                        path.join(dir.publish, 'publish-0.json'))
        const log = await notice.promise
        destructible.destroy()
        await destructible.promise
        assert.deepStrictEqual(log.map(entry => entry.label), [ 'json' ], 'json error')
    })
})
