var Supersede = require('supersede')

var sequence = 0

// TODO Could put filters here, but the reason I wanted them was to explode
// exceptions, because why else are you placing garbage into your logging
// messages, but then why place exceptions into your logging messages, explode
// them at the source, what was I tihnking?
//
// TOOD You can also do special things with a special logger.
var levels = new Supersede
levels.set([ '' ], 'info')
var LEVEL = { none: -1, error: 0, warn: 1, info: 2, debug: 3, trace: 4 }

exports.Date = Date

// TODO Keep wanting to optimize this, but the optimization is the level. If
// someone truly does not want to pay for the logging, they can set the logging
// level to "none".
exports.json = function (path, level, qualifier, name, properties) {
    if (LEVEL[level] > LEVEL[levels.get(path)]) {
        return
    }
    var entry = {}
    for (var key in properties) {
        entry[key] = properties[key]
    }
    for (var key in exports.properties) {
        entry[key] = exports.properties[key]
    }
    entry.sequence = sequence++
    entry.level = level
    entry.qualifier = qualifier
    entry.name = name
    entry.qualified = qualifier + '#' + name
    entry.when = exports.Date.now()
    this.sink.write(new Buffer(JSON.stringify(entry) + '\n'))
}

exports.sink = { write: function () {} }

exports.setLevel = function (path, level) {
    if (level == null) {
        level = path
        path = ''
    } else {
        path = '.' + path
    }
    levels.set(path.split('.'), level)
}

exports.clearLevel = function (context) {
    if (context == null) {
        levels.remove([ '' ])
        levels.set([ '' ], 'info')
    } else {
        levels.remove(('.' + context).split('.'))
    }
}

exports.getLevel = function (path) {
    return levels.get(('.' + path).split('.'))
}

exports.properties = {}

exports.filename = module.filename
