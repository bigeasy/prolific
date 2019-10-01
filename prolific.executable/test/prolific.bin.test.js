require('proof')(1, async (okay) => {
    const prolific = require('..')
    const path = require('path')
    const stream = require('stream')
    const program = path.join(__dirname, 'program.js')
    const processor = path.join(__dirname, 'prolific.bin.prolific.js')
    const child = prolific([ '--inherit', '99', '--processor', processor, 'node', program ])
    await new Promise(resolve => setTimeout(resolve, 1000))
    child.destroy()
    okay(0, await child.promise, 'ran')
})
