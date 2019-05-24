describe('evaluator', () => {
    const assert = require('assert')
    const Evaluator = require('../evaluator')
    const path = require('path')
    it('can load a processor', async () => {
        const processor = Evaluator.create(path.join(__dirname, 'processor.js'))
    })
})
