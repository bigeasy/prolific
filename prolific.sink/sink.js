var Acceptor = require('prolific.accept')

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

// Replace with a dummy date for testing.
exports.Date = Date

// Accept a log entry and turn it into a JSON object.

//
exports.json = function (path, level, qualifier, label, properties) {
    var joined = [{
        when: exports.Date.now(),
        pid: process.pid,
        level: level,
        qualifier: qualifier,
        label: label,
        qualified: qualifier + '#' + label
    }, exports.properties, properties]
    if (this.acceptor.accept(joined)) {
        this.queue.push(joined)
    }
}

exports.queue = []

exports.properties = {}

exports.acceptor = new Acceptor(true, [])

exports.filename = module.filename
