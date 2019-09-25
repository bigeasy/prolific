describe('evaluator', () => {
    const assert = require('assert')
    const Evaluator = require('../evaluator')
    const path = require('path')
    const fs = require('fs').promises
    it('can load a processor', async () => {
        const file = path.join(__dirname, 'processor.js')
        const source = await fs.readFile(file, 'utf8')
        const resolved = Evaluator.resolve(file, path.resolve(__dirname, '..', 'evaluator.js'))

        const processor = Evaluator.create(source, resolved)
        const triage = await processor.triage()
        assert(!triage(1), 'triage skip')
        assert(triage(0), 'triage hit')
        const process = await processor.process()
        assert.deepStrictEqual(await process(), {
            other: 1,
            __dirname: path.resolve(__dirname, '..'),
            __filename: path.resolve(__dirname, '..', 'processor.js')
        }, 'processor')
    })
    it('can resolve a processor module', () => {
        const resolved = Evaluator.resolve('./test/processor', path.resolve(__dirname, '..', 'evaluator.js'))
        assert.deepStrictEqual(resolved, {
            filename: path.resolve(__dirname, './processor.js'),
            __filename: path.resolve(__dirname, './processor.js')
        }, 'resolved')
    })
})
