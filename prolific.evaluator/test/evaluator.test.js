describe('evaluator', () => {
    const assert = require('assert')
    const Evaluator = require('../evaluator')
    const path = require('path')
    const fs = require('fs').promises
    it('can load a processor', async () => {
        const file = path.join(__dirname, 'processor.js')
        const source = await fs.readFile(file, 'utf8')
        const processor = Evaluator.create(source, file, file)
        const triage = await processor.triage()
        assert(!triage(1), 'triage skip')
        assert(triage(0), 'triage hit')
        const process = await processor.process()
        assert.equal(await process(), 1, 'processor')
    })
})
