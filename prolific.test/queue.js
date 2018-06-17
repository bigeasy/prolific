var isSubset = require('is-subset')

function Queue () {
    this.entries = []
}

Queue.prototype.push = function (entry) {
    this.entries.push(entry)
}

Queue.prototype.shift = function (condition) {
    var f = condition
    if (f == null) {
        f = function () { return true }
    } else if (typeof f != 'function') {
        f = function (entry) {
            return isSubset(entry, condition)
        }
    }
    for (;;) {
        if (this.entries.length == 0) {
            return null
        }
        var entry = this.entries.shift()
        if (f(entry)) {
            return entry
        }
    }
}

module.exports = Queue
