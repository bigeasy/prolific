const assert = require('assert')

exports.create = function (source) {
    const loader = new Function('processor', source)
    const processor = {}
    loader(processor)
    assert(typeof processor.triage == 'function')
    assert(typeof processor.process == 'function')
    return processor
}
