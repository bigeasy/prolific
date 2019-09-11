describe('killer', () => {
    const once = require('prospective/once')
    const children = require('child_process')
    const path = require('path')
    it('can watch processes', async () => {
        const Killer = require('../killer')
        const killer = new Killer(100)
        const run = killer.run()
        const killed = once(killer, 'killed').promise
        const child = children.spawn('node', [ path.resolve(__dirname, 'child') ])
        killer.watch(child.pid)
        await new Promise(resolve => setTimeout(resolve, 250))
        child.kill()
        await killed
        killer.destroy()
        await run
    })
})
