const coalesce = require('extant')
const assert = require('assert')
const path = require('path')
const _module = require('module')

exports.create = function (source, file, relative) {
    const resolved = path.resolve(file)
    const loader = new Function('processor', 'require', '__dirname', '__filename', source)
    const processor = {}
    const createRequire = coalesce(_module.createRequire, _module.createRequireFromPath)
    const _require = createRequire.call(_module, path.resolve(relative))
    loader(processor, _require, path.dirname(resolved), resolved)
    assert(typeof processor.triage == 'function')
    assert(typeof processor.process == 'function')
    return processor
}
