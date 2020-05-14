require('proof')(1, prove)

async function prove (okay) {
    const Destructible = require('destructible')
    const path = require('path')
    const fs = require('fs').promises

    try {
        await fs.unlink(path.join(__dirname, 'log-1970-01-01-00-00-1'))
    } catch (e) {
        if (e.code != 'ENOENT') {
            throw e
        }
    }

    try {
        await fs.unlink(path.join(__dirname, 'log-1970-01-01-00-01-1'))
    } catch (e) {
        if (e.code != 'ENOENT') {
            throw e
        }
    }

    const file = path.join(__dirname, 'log')

    {
        const destructible = new Destructible('t/file.t')

        const Writer = require('..')
        let now = 0

        const writer = new Writer(destructible.durable('qualified'), file, {
            suffix: 1,
            rotate: 10,
            Date: { now: function () { return now } }
        })

        await new Promise(resolve => setImmediate(resolve))
        writer.push({ a: 1 })
        await new Promise(resolve => setImmediate(resolve))
        writer.push({ a: 2 })
        await new Promise(resolve => setTimeout(resolve, 150))

        destructible.destroy()

        await destructible.destructed

        const log = await fs.readFile(path.join(__dirname, 'log-1970-01-01-00-00-1'), 'utf8')
        const lines = log.split('\n')
        lines.pop()
        okay(lines.map(JSON.parse), [{ a: 1 }, { a: 2 }], 'map')
    }
}
