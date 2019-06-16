const assert = require('assert')
const path = require('path')

exports.create = function (source, file) {
    const loader = new Function('processor', '__dirname', '__filename', source)
    const processor = {}
    loader(processor, path.dirname(file), path.basename(file))
    assert(typeof processor.triage == 'function')
    assert(typeof processor.process == 'function')
    return processor
}
