describe('logger', () => {
    const fs = require('fs').promises
    const assert = require('assert')
    const path = require('path')

    const rimraf = require('rimraf')
    const callback = require('prospective/callback')
    const once = require('prospective/once')

    const Watcher = require('prolific.watcher')


    const Logger = require('../logger')

    const TMPDIR = path.join(__dirname, 'tmp')
    const fnv = require('hash.fnv')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
    }
    it('can write log entries', async () => {
        await callback(callback => rimraf(TMPDIR, callback))
        await fs.mkdir(dir.publish, { recursive: true })
        await fs.mkdir(dir.stage, { recursive: true })
        const Destructible = require('destructible')
        const destructible = new Destructible(__filename)
        const watcher = new Watcher(destructible, buffer => {
            return fnv(0, buffer, 0, buffer.length)
        }, path.join(TMPDIR, 'publish'))
        const data = once(watcher, 'data').promise
        const logger = new Logger(destructible.durable('logger'), {
            now: () => 0
        }, TMPDIR, 2, 100)
        logger.log({ a: 1 })
        const [ log ] = await data
        assert.deepStrictEqual(log.body.entries, [ { when: 0, a: 1 } ])
        destructible.destroy()
        await destructible.promise
    })
})
