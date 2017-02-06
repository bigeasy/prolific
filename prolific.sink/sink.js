// A path based set where the most specific path wins.
var Supersede = require('supersede')

// Log entry sequence number. TODO Needs to wrap, or else use Monotonic.
var sequence = 0

// No filters here. If you want filter you can decorate your sink. Replace the
// reosolved sink with one that wraps the reosolved sink. Do what you need to do
// with the log entry before passing it on to the original sink.

// We do allow you to short circuit logging with levels which are associated
// with a path. Filterering can also be done by the Prolific monitor process,
// but this saves the trouble of serializing the deserializing only to throw
// away the results.

// I've wanted to optimize away this level check, but it has been of some use to
// me, so I'm going to try to find a way to make it easier to adjust so I'll
// find more use for it.

// Map of paths to levels.
var levels = new Supersede
// Default level is `info` for all paths.
levels.set([ '' ], 'info')

// Map of level names to numbers.
var LEVEL = { none: -1, error: 0, warn: 1, info: 2, debug: 3, trace: 4 }

// Replace with a dummy date for testing.
exports.Date = Date

// Accept a log entry and turn it into a JSON object.

//
exports.json = function (path, level, qualifier, name, properties) {
    if (LEVEL[level] > LEVEL[levels.get(path)]) {
        return
    }
    var entry = {
        when: exports.Date.now(),
        sequence: sequence++,
        level: level,
        qualifier: qualifier,
        name: name,
        qualified: qualifier + '#' + name
    }
    for (var key in exports.properties) {
        if (!(key in entry)) {
            entry[key] = exports.properties[key]
        }
    }
    for (var key in properties) {
        if (!(key in entry)) {
            entry[key] = properties[key]
        }
    }
    // TODO Do not write out JSON. We want to allow decoration for extension.
    // The reason you're serializing here is because you'd imagined that you
    // could advise people to just put `stdout` as the `writer`, but that will
    // never happen, and a simple decorator could do that anyway.
    this.writer.write(new Buffer(JSON.stringify(entry) + '\n'))
}

exports.writer = { write: function () {} }

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
