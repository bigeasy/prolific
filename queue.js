var cadence = require('cadence')

function Queue () {
    this._entries = [[]]
}

Queue.prototype.flush = cadence(function (async, out) {
    if (this._entries.length == 1) {
        this._entries.unshift([])
    }
    async(function () {
        out.write(this._entries[this._entries.length - 1].join(''), async())
    }, function () {
        this._entries.pop()
    })
})

Queue.prototype.write = function (line) {
    this._entries[0].push(line)
}

module.exports = Queue
