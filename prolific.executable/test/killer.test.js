describe('killer', () => {
    const once = require('prospective/once')
    const children = require('child_process')
    const path = require('path')
    const Killer = require('../killer')
    it('can stop', async () => {
        const killer = new Killer(100, 200)
        killer.destroy()
    })
    it('can watch processes', async () => {
        const killer = new Killer(100, 200)
        const run = killer.run()
        const first = once(killer, 'killed').promise
        const child = {
            first: children.spawn('node', [ path.resolve(__dirname, 'child') ]),
            second: children.spawn('node', [ path.resolve(__dirname, 'child') ])
        }
        killer.exit(child.first.pid)
        killer.exit(child.first.pid)
        await new Promise(resolve => setTimeout(resolve, 101))
        process.kill(child.first.pid)
        await first
        killer.exit(child.second.pid)
        killer.exited(child.first.pid)
        await new Promise(resolve => setTimeout(resolve, 101))
        const second = once(killer, 'killed').promise
        process.kill(child.second.pid)
        await second
        killer.exited(child.second.pid)
        killer.destroy()
        killer.destroy()
        await run
    })
})
