require('proof')(4, async (okay) => {
    const Evaluator = require('../evaluator')
    const path = require('path')
    const fs = require('fs').promises
    {
        const file = path.join(__dirname, 'processor.js')
        const source = await fs.readFile(file, 'utf8')
        const resolved = Evaluator.resolve(file, path.resolve(__dirname, '..', 'evaluator.js'))

        const processor = Evaluator.create(source, resolved)
        const triage = await processor.triage()
        okay(!triage('info'), 'triage skip')
        okay(triage('panic'), 'triage hit')
        const process = await processor.process()
        okay(await process(), {
            other: 1,
            __dirname: path.resolve(__dirname, '..'),
            __filename: path.resolve(__dirname, '..', 'processor.js')
        }, 'processor')
    }
    {
        const resolved = Evaluator.resolve('./test/processor', path.resolve(__dirname, '..', 'evaluator.js'))
        okay(resolved, {
            filename: path.resolve(__dirname, './processor.js'),
            __filename: path.resolve(__dirname, './processor.js')
        }, 'resolved')
    }
})
