require('proof')(2, async (okay) => {
    const { once } = require('eject')
    const children = require('child_process')
    const path = require('path')
    const Killer = require('../killer')
    {
        const killer = new Killer(100)
        killer.destroy()
    }
    {
        const killer = new Killer(100)
        const run = killer.run()
        const first = once(killer, 'killed').promise
        const child = {
            first: children.spawn('node', [ path.resolve(__dirname, 'child') ]),
            second: children.spawn('node', [ path.resolve(__dirname, 'child') ])
        }
        killer.watch(child.first.pid)
        killer.watch(child.first.pid)
        await new Promise(resolve => setTimeout(resolve, 101))
        process.kill(child.first.pid)
        okay(await first, [ child.first.pid ], 'first')
        killer.watch(child.second.pid)
        killer.exited(child.first.pid)
        await new Promise(resolve => setTimeout(resolve, 101))
        const second = once(killer, 'killed').promise
        process.kill(child.second.pid)
        okay(await second, [ child.second.pid ], 'second')
        killer.exited(child.second.pid)
        killer.destroy()
        killer.destroy()
        await run
    }
})
