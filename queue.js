var Staccato = require('staccato')
var cadence = require('cadence')

function Queue (out) {
    this._entries = []
    this.out = new Staccato(out, false)
}

Queue.prototype.flush = cadence(function (async) {
    var blob = this._entries.join('')
    this._entries.length = 0
    this.out.write(blob, async())
})

Queue.prototype.write = function (line) {
    this._entries.push(line)
}

module.exports = Queue
