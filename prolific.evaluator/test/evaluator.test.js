describe('evaluator', () => {
    const assert = require('assert')
    const Evaluator = require('../evaluator')
    const path = require('path')
    const fs = require('fs').promises
    it('can load a processor', async () => {
        const source = await fs.readFile(path.join(__dirname, 'processor.js'), 'utf8')
        const processor = Evaluator.create(source)
    })
})
