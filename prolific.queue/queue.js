var cadence = require('cadence')
var fnv = require('hash.fnv')
var hex = require('./hex')

function Queue () {
    this._entries = [[]]
    this._sink = {}
    this._previousChecksum = hex(0xaaaaaaaa, 8)
}

Queue.prototype.createSink = function (stream) {
    return new Sink(this, stream)
}

function Sink (queue, stream) {
    this._queue = queue
    this._stream = stream
    this._previousChecksum = hex(0xaaaaaaaa, 8)
    this._initialized = false
}

Queue.prototype.exit = function (stderr) {
    this._sink._termianted = true
    var messages = this._entries.pop() || []
    while (this._entries.length) {
        messages.push.apply(messages, this._entries.pop())
    }
    if (messages.length == 0) {
        return
    }
    var buffer, checksum
    var buffers = []
    buffer = new Buffer(this._previousChecksum + '\n')
    checksum = hex(fnv(0, buffer, 0, buffer.length), 8)
    buffers.push(new Buffer(hex(0xaaaaaaaa, 8) + ' ' + checksum + ' ' + buffer.length + '\n'), buffer)
    buffer = new Buffer(messages.join(''))
    checksum = hex(fnv(0, buffer, 0, buffer.length), 8)
    buffers.push(new Buffer(this._previousChecksum + ' ' + checksum + ' ' + buffer.length + '\n'), buffer)
    stderr.write(Buffer.concat(buffers))
}

Sink.prototype._write = cadence(function (async, string) {
    var buffer = new Buffer(string)
    var checksum = hex(fnv(0, buffer, 0, buffer.length), 8)
    async(function () {
        this._stream.write(this._previousChecksum + ' ' + checksum + ' ' + buffer.length + '\n', async())
    }, function () {
        this._stream.write(buffer, async())
    }, function () {
        return [ checksum ]
    })
})

Sink.prototype.open = cadence(function (async, out) {
    this._queue._sink._termianted = true
    this._queue._sink = this
    async(function () {
        this._write(this._queue._previousChecksum + '\n', async())
    }, function () {
        this._previousChecksum = this._queue._previousChecksum
    })
})

Sink.prototype.flush = cadence(function (async, out) {
    if (this._termianted) {
        return
    }

    var entries = this._queue._entries

    if (entries.length == 1) {
        if (entries[0].length == 0) {
            return
        }
        entries.unshift([])
    }

    async(function () {
        this._write(entries[entries.length - 1].join(''), async())
    }, function (checksum) {
        this._queue._previousChecksum = this._previousChecksum = checksum
        entries.pop()
    })
})

Queue.prototype.write = function (line) {
    this._entries[0].push(line)
}

module.exports = Queue
