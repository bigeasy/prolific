require('proof')(1, async (okay) => {
    const fs = require('fs').promises
    const path = require('path')

    const { once } = require('eject')

    const Watcher = require('prolific.watcher')

    const Logger = require('../logger')

    const TMPDIR = path.join(__dirname, 'tmp')
    const fnv = require('hash.fnv')
    const dir = {
        stage: path.resolve(TMPDIR, 'stage'),
        publish: path.resolve(TMPDIR, 'publish')
    }
    await fs.rmdir(TMPDIR, { recursive: true })
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
    logger.say('label', { a: 1 })
    const [ log ] = await data
    okay(log.body.entries, [ { when: 0, qualifier: 'prolific', label: 'label', a: 1 } ], 'entries')
    destructible.destroy()
    await destructible.destructed
})
