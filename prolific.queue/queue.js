var abend = require('abend')
var cadence = require('cadence')
var Chunk = require('prolific.chunk')
var stream = require('stream')

function Queue (streamId, stderr) {
    this._streamId = streamId
    this._buffers = []
    this._chunks = []
    this._chunkNumber = 1
    this._previousChecksum = 'aaaaaaaa'
    this._stream = new stream.PassThrough // for an `end`
    this._terminated = false
    this._writing = true
    this._closed = false
    this._stderr = stderr
    this._chunks.push(new Chunk(this._streamId, 0, Buffer.from(''), 1))
}

Queue.prototype.setPipe = function (stream) {
    if (this._closed) {
        stream.end()
    } else {
        this._stream = stream
        this._sendAsync(abend)
    }
}

Queue.prototype.push = function (json) {
    this._buffers.push(Buffer.from(JSON.stringify(json) + '\n'))
    if (this._closed) {
        this._chunkEntries()
        this._sendSync()
    } else if (!this._writing) {
        this._writing = true
        this._sendAsync(abend)
    }
}

Queue.prototype._chunkEntries = function () {
    var buffers = this._buffers
    if (buffers.length == 0) {
        return
    }
    this._buffers = []

    var buffer = Buffer.concat(buffers)
    this._chunks.push(new Chunk(this._streamId, this._chunkNumber++, buffer, buffer.length))
}

// Flush logs to the dedicated logging pipe. Chunks entries so that we can send
// many lines in a single chunk. Then writes. When it comes back from a write it
// checks to see if the pipe has ended and breaks early, otherwise it continues
// until there are no lines or chunks to _sendAsync.

//
Queue.prototype._sendAsync = cadence(function (async) {
    async.loop([], function () {
        if (this._chunks.length == 0) {
            this._chunkEntries()
            if (this._chunks.length == 0) {
                this._writing = false
                return [ async.break ]
            }
        }
        var chunk = this._chunks[0]
        async(function () {
            this._stream.write(Buffer.concat([
                chunk.header(this._previousChecksum), chunk.buffer
            ]), async())
        }, function () {
            if (this._closed) {
                return [ async.break ]
            }
            this._previousChecksum = chunk.checksum
            this._chunks.shift()
        })
    })
})

// Necessary for uncaught exception when the default shutdown hooks in Node.js
// are disabled by a `SIGTERM` handler. My test to assert that we'd shutdown
// normally passed because the only hook was the async pipe between the parent
// and child. That is closed by `exit`. Anything else is going to keep the
// socket open, so you need to exit explicitly. If you exit immediately after
// write, then you will not flush STDERR.
//
// Put this note somewhere where you'll not delete it.
//
// The `close` method closes the asynchronous logging pipe to the monitor. We
// continue to log each line to `STDERR` for the remainder of the program's
// execution.
//
// In order to get every last logging message, the user needs to disable default
// signal handling because the default signal handler for `SIGTERM` will close
// the asynchronous pipe abruptly so that messages waiting to go out the
// asynchronous pipe will be lost. The default signal handlers will prevent an
// `process` from emitting and `"exit"` event. Thus, a `SIGTERM` signal handler
// should close the Prolific Queue so that any waiting messages can be sent
// synchronously via `STDERR`.
//
// This can also be done to capture an `uncaughtException`. Register an
// `uncaughtException` handler that closes the queue, logs the exception, then
// rethrows the exception. Because the log entry is written after queue is
// closed, the uncaught exception log entry will be send synchronously.

//
Queue.prototype.close = function () {
    if (this._closed) {
        return
    }

    this._closed = true
    this._writing = true
    this._stream.end()

    this._chunkEntries()

    if (this._chunks.length == 0) {
        this._chunks.unshift(new Chunk(this._streamId, 0, Buffer.from(''), this._chunkNumber))
        this._previousChecksum = 'aaaaaaaa'
    } else if (this._chunks.length > 0 && this._chunks[0].number != 0) {
        this._chunks.unshift(new Chunk(this._streamId, 0, Buffer.from(''), this._chunks[0].number))
        this._previousChecksum = 'aaaaaaaa'
    }

    this._sendSync()
}

Queue.prototype._sendSync = function () {
    var buffers = []
    while (this._chunks.length) {
        var chunk = this._chunks.shift()
        buffers.push(chunk.header(this._previousChecksum), chunk.buffer)
        this._previousChecksum = chunk.checksum
    }
    this._stderr.write(Buffer.concat(buffers))
}

module.exports = Queue
