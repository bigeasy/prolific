describe('executable', () => {
    const assert = require('assert')
    it('can execute', async () => {
        const prolific = require('..')
        const path = require('path')
        const stream = require('stream')
        const program = path.join(__dirname, 'program.js')
        const configuration = path.join(__dirname, 'prolific.bin.prolific.js')
        const child = prolific([ '--inherit', '99', '--processor', configuration, 'node', program ], {
            $stderr: new stream.PassThrough({ highWaterMark: 1 })
        })
        await new Promise(resolve => setTimeout(resolve, 1000))
        child.destroy()
        assert.equal(0, await child.promise, 'ran')
    })
})
