const coalesce = require('extant')
const assert = require('assert')
const path = require('path')
const _module = require('module')

function createRequire (filename) {
    const createRequire = coalesce(_module.createRequire, _module.createRequireFromPath)
    return createRequire.call(_module, filename)
}

exports.resolve = function (processor, main) {
    if (processor[0] == path.sep) {
        return {
            filename: processor,
            __filename: path.resolve(path.dirname(main), path.basename(processor))
        }
    }
    const _require = createRequire(main)
    const filename = _require.resolve(processor)
    return { filename, __filename: filename }
}

exports.create = function (source, resolved) {
    const loader = new Function('exports', 'module', 'require', '__dirname', '__filename', source)
    const parentage = path.resolve(__dirname, 'parentage.js')
    const _require = createRequire(resolved.__filename)
    delete _require.cache[parentage]
    const __module = _require(parentage)
    __module.children.shift()
    __module.parent = module
    loader(__module.exports, __module, _require,
           path.dirname(resolved.__filename), resolved.__filename)
    __module.loaded = true
    assert(typeof __module.exports.triage == 'function')
    assert(typeof __module.exports.process == 'function')
    return __module.exports
}
