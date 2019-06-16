describe('evaluator', () => {
    const assert = require('assert')
    const Evaluator = require('../evaluator')
    const path = require('path')
    const fs = require('fs').promises
    it('can load a processor', async () => {
        const file = path.join(__dirname, 'processor.js')
        const source = await fs.readFile(file, 'utf8')
        const processor = Evaluator.create(source, file)
    })
})
