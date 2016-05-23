var cadence = require('cadence')
var Chunk = require('prolific.chunk')

function Queue (pid, stream) {
    this._pid = pid
    this._entries = []
    this._chunks = []
    this._chunkNumber = 1
    this._previousChecksum = 'aaaaaaaa'
    this._stream = stream
    this._chunks.push(new Chunk('x', 0, new Buffer(''), 1))
}

Queue.prototype.write = function (line) {
    this._entries.push(line)
}

Queue.prototype._chunkEntries = function () {
    var entries = this._entries
    if (entries.length == 0) {
        return
    }
    this._entries = []

    var buffer = new Buffer(entries.join(''))
    this._chunks.push(new Chunk('x', this._chunkNumber++, buffer, buffer.length))
}

Queue.prototype.flush = cadence(function (async) {
    if (this._termianted) {
        return
    }

    this._chunkEntries()

    var loop = async(function () {
        if (this._chunks.length == 0) {
            return [ loop.break ]
        }
        var chunk = this._chunks[0]
        async(function () {
            this._stream.write(chunk.header(this._previousChecksum), async())
        }, function () {
// TODO Wait for a response, let's get for reals here.
            this._stream.write(chunk.buffer, async())
        }, function () {
            this._previousChecksum = chunk.checksum
            this._chunks.shift()
        })
    })()
})

Queue.prototype.exit = function (stderr) {
    if (this._termianted) {
        return
    }

    this._termianted = true

    this._chunkEntries()

    if (this._chunks.length == 0) {
        return
    }

    this._chunks.unshift(new Chunk('x', 0, new Buffer(''), this._chunks[0].number))

    var buffers = []
    while (this._chunks.length) {
        var chunk = this._chunks.shift()
        buffers.push(chunk.header(this._previousChecksum), chunk.buffer)
        this._previousChecksum = chunk.checksum
    }

    stderr.write(Buffer.concat(buffers))
}

module.exports = Queue
