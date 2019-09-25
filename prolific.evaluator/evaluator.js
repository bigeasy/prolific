const coalesce = require('extant')
const assert = require('assert')
const path = require('path')
const _module = require('module')

exports.create = function (source, file, relative) {
    const resolved = path.resolve(file)
    const basename = path.basename(file)
    const dirname = path.dirname(relative)
    const filename = path.resolve(dirname, basename)
    const loader = new Function('exports', 'module', 'require', '__dirname', '__filename', source)
    const processor = {}
    const createRequire = coalesce(_module.createRequire, _module.createRequireFromPath)
    const _require = createRequire.call(_module, filename)
    const parentage = path.resolve(__dirname, 'parentage.js')
    delete _require.cache[parentage]
    const __module = _require(parentage)
    delete _require.cache[parentage]
    __module.children.shift()
    __module.parent = module
    loader(__module.exports, __module, _require, path.dirname(filename), filename)
    __module.loaded = true
    assert(typeof __module.exports.triage == 'function')
    assert(typeof __module.exports.process == 'function')
    return __module.exports
}
