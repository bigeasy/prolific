const assert = require('assert')
const fs = require('fs').promises

exports.create = async function (file) {
    const source = await fs.readFile(file, 'utf8')
    const loader = new Function('processor', source)
    const processor = {}
    loader(processor)
    assert(typeof processor.triage == 'function')
    assert(typeof processor.process == 'function')
    return processor
}
