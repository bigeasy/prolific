var rescue = require('rescue')
var abend = require('abend')
var cadence = require('cadence')
var Chunk = require('prolific.chunk')

function Queue (stream, stderr) {
    this._buffers = []
    this._chunks = []
    this._chunkNumber = 1
    this._previousChecksum = 'aaaaaaaa'
    this._stream = stream
    this._terminated = false
    this._closed = false
    this._writing = false
    this._stderr = stderr
    this._chunks.push(new Chunk(0, new Buffer(''), 1))
}

Queue.prototype.write = function (buffer) {
    this._buffers.push(buffer)
    if (!this._writing) {
        this._writing = true
        this.flush(abend)
    }
}

Queue.prototype._chunkEntries = function () {
    var buffers = this._buffers
    if (buffers.length == 0) {
        return
    }
    this._buffers = []

    var buffer = Buffer.concat(buffers)
    this._chunks.push(new Chunk(this._chunkNumber++, buffer, buffer.length))
}

Queue.prototype._checkTerminated = function () {
    if (this._closed) {
        throw new Error('bigeasy.prolific.queue#closed')
    }
}

Queue.prototype.flush = cadence(function (async) {
    async([function () {
        var loop = async(function () {
            this._checkTerminated()
            if (this._chunks.length == 0) {
                this._chunkEntries()
                if (this._chunks.length == 0) {
                    this._writing = false
                    return [ loop.break ]
                }
            }
            var chunk = this._chunks[0]
            async(function () {
                this._checkTerminated()
                this._stream.write(chunk.header(this._previousChecksum), async())
            }, function () {
                this._checkTerminated()
    // TODO Wait for a response, let's get for reals here.
                this._stream.write(chunk.buffer, async())
            }, function () {
                this._checkTerminated()
                this._previousChecksum = chunk.checksum
                this._chunks.shift()
            })
        })()
    }, rescue(/^bigeasy.prolific.queue#closed$/, function () {
        this.exit(async())
    })])
})

// Necessary for uncaught exception when the default shutdown hooks in Node.js
// are disabled by a `SIGTERM` handler. My test to assert that we'd shutdown
// normally passed because the only hook was the async pipe between the parent
// and child. That is closed by `exit`. Anything else is going to keep the
// socket open, so you need to exit explicitly. If you exit immediately after
// write, then you will not flush STDERR.

// Put this note somewhere where you'll not delete it.
Queue.prototype.close = function () {
    if (!this._closed) {
        this._closed = true
        this._stream.end()
    }
}

Queue.prototype.exit = function (callback) {
    this._writing = false

    this.close()

    this._chunkEntries()

    if (this._chunks.length == 0) {
        return
    }

    if (!this._terminated) {
        this._terminated = true
        this._chunks.unshift(new Chunk(0, new Buffer(''), this._chunks[0].number))
        this._previousChecksum = 'aaaaaaaa'
    }

    var buffers = []
    while (this._chunks.length) {
        var chunk = this._chunks.shift()
        buffers.push(chunk.header(this._previousChecksum), chunk.buffer)
        this._previousChecksum = chunk.checksum
    }

    this._stderr.write(Buffer.concat(buffers), callback)
}

module.exports = Queue
