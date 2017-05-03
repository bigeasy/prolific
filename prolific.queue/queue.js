var rescue = require('rescue')
var abend = require('abend')
var cadence = require('cadence')
var Chunk = require('prolific.chunk')
var stream = require('stream')

function Queue (pid, stderr) {
    this._pid = pid
    this._incoming = []
    this._buffers = this._incoming
    this._chunks = []
    this._chunkNumber = 1
    this._previousChecksum = 'aaaaaaaa'
    this._stream = new stream.PassThrough // for an `end`
    this._terminated = false
    this._writing = true
    this._closed = false
    this._stderr = stderr
    this._chunks.push(new Chunk(this._pid, 0, new Buffer(''), 1))
}

Queue.prototype.setPipe = function (stream) {
    this._stream = stream
    this._writing = false
}

Queue.prototype.push = function (json) {
    this._incoming.push(new Buffer(JSON.stringify(json) + '\n'))
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
    this._chunks.push(new Chunk(this._pid, this._chunkNumber++, buffer, buffer.length))
}

Queue.prototype._checkTerminated = function () {
    if (this._closed) {
        throw new Error('prolific.queue#closed')
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
                this._stream.write(Buffer.concat([
                    chunk.header(this._previousChecksum), chunk.buffer
                ]), async())
            }, function () {
                this._checkTerminated()
                this._previousChecksum = chunk.checksum
                this._chunks.shift()
            })
        })()
    }, rescue(/^prolific.queue#closed$/, function () {
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

Queue.prototype.exit = function () {
    this.close()

    // Setting incoming to a separate array from buffers means no more buffers
    // to chunk.
    this._incoming = []

    this._chunkEntries()

    if (!this._terminated) {
        var number = this._chunks.length ? this._chunks[0].number : this._chunkNumber
        this._chunks.unshift(new Chunk(this._pid, 0, new Buffer(''), number))
        this._previousChecksum = 'aaaaaaaa'
        this._terminated = true
    }

    var buffers = []
    while (this._chunks.length) {
        var chunk = this._chunks.shift()
        buffers.push(chunk.header(this._previousChecksum), chunk.buffer)
        this._previousChecksum = chunk.checksum
    }

    this._stderr.write(Buffer.concat(buffers))

    // Setting this to true means no more flush.
    this._writing = true
}

module.exports = Queue
