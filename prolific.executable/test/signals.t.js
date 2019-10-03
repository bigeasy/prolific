require('proof')(1, async (okay) => {
    const path = require('path')
    const children = require('child_process')
    const once = require('prospective/once')
    const signaled = path.resolve(__dirname, 'signaled.js')
    const processor = path.resolve(__dirname, 'prolific.bin.prolific.js')
    const prolific = path.resolve(__dirname, '..', 'prolific.bin.js')
    const child = children.spawn('node', [
        'prolific.bin.js', '--processor', processor, 'node', signaled
    ], { stdio: 'inherit' })
    const exit = once(child, 'exit').promise
    // This timeout is necessary to give NYC time enough to instrument the
    // source code of the child.
    await new Promise(resolve => setTimeout(resolve, 500))
    child.kill('SIGINT')
    const [ code, signal ] = await exit
    okay(await exit, [ null, 'SIGINT'], 'signaled')
})
