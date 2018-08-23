var abend = require('abend')
var cadence = require('cadence')
var Chunk = require('prolific.chunk')
var stream = require('stream')

function Queue (pid, stderr) {
    this._pid = pid
    this._buffers = []
    this._chunks = []
    this._chunkNumber = 1
    this._previousChecksum = 'aaaaaaaa'
    this._stream = new stream.PassThrough // for an `end`
    this._terminated = false
    this._writing = true
    this._closed = false
    this._stderr = stderr
    this._chunks.push(new Chunk(this._pid, 0, Buffer.from(''), 1))
}

Queue.prototype.setPipe = function (stream) {
    if (this._closed) {
        stream.end()
    } else {
        this._stream = stream
        this.flush(abend)
    }
}

Queue.prototype.push = function (json) {
    this._buffers.push(Buffer.from(JSON.stringify(json) + '\n'))
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

// Flush logs to the dedicated logging pipe. Chunks entries so that we can send
// many lines in a single chunk. Then writes. When it comes back from a write it
// checks to see if the pipe has ended and breaks early, otherwise it continues
// until there are no lines or chunks to flush.

//
Queue.prototype.flush = cadence(function (async) {
    var loop = async(function () {
        if (this._chunks.length == 0) {
            this._chunkEntries()
            if (this._chunks.length == 0) {
                this._writing = false
                return [ loop.break ]
            }
        }
        var chunk = this._chunks[0]
        async(function () {
            this._stream.write(Buffer.concat([
                chunk.header(this._previousChecksum), chunk.buffer
            ]), async())
        }, function () {
            if (this._closed) {
                return [ loop.break ]
            }
            this._previousChecksum = chunk.checksum
            this._chunks.shift()
        })
    })()
})

// Necessary for uncaught exception when the default shutdown hooks in Node.js
// are disabled by a `SIGTERM` handler. My test to assert that we'd shutdown
// normally passed because the only hook was the async pipe between the parent
// and child. That is closed by `exit`. Anything else is going to keep the
// socket open, so you need to exit explicitly. If you exit immediately after
// write, then you will not flush STDERR.

// Put this note somewhere where you'll not delete it.

// Close will close the logging pipe. We will continue logging to STDERR until
// the `exit` function is called. We set an `uncaughtException` and `exit`
// handler in Prolific Shuttle to call `Queue.exit`. `Queue.exit` will write an
// end of stream indicator to the log. Both the `uncaughtException` and `exit`
// events indicate that that is the end of user code, this is the last time the
// program will be called. `exit` because that's what it signals.
// `uncaughtException` because we retrown the reported uncaught exception.

// Note that if you decided to call close and then run the program for a while
// you're going to leak memory because STDERR logging will not be flushed until
// `Queue.exit` is called. The STDERR logging is intended to capture a few final
// logging messages between the initiation of program shutdown and actual exit
// as well as any buffered and unflushed logs that didn't make it out the
// dedicated logging pipe.

//
Queue.prototype.close = function () {
    if (!this._closed) {
        this._closed = true
        this._writing = true
        this._stream.end()
    }
}

// Called by the Prolific Shuttle `uncaughtException` and `exit` handlers. Those
// handlers indicate the end of the program, no other iterations of the event
// loop. That's what the `exit` event means. The `uncaughtException` event
// will short-circuit the `exit` event. We rethrow the reported uncaught
// exception and Node.js exits immediately with no `exit` event.

// Because this is the last event loop we can write an end of stream indicator.
// This will let our monitor know that it can terminate.

//
Queue.prototype.exit = function () {
    if (this._terminated) {
        return
    }

    this.close()

    this._terminated = true

    this._chunkEntries()

    if (this._chunks.length == 0) {
        this._chunks.unshift(new Chunk(this._pid, 0, Buffer.from(''), this._chunkNumber))
        this._previousChecksum = 'aaaaaaaa'
    } else if (this._chunks.length > 0 && this._chunks[0].number != 0) {
        this._chunks.unshift(new Chunk(this._pid, 0, Buffer.from(''), this._chunks[0].number))
        this._previousChecksum = 'aaaaaaaa'
    }

    var buffers = []
    while (this._chunks.length) {
        var chunk = this._chunks.shift()
        buffers.push(chunk.header(this._previousChecksum), chunk.buffer)
        this._previousChecksum = chunk.checksum
    }

    var chunk = new Chunk(this._pid, this._chunkNumber++, Buffer.from(''), 0)
    chunk.checksum = 'aaaaaaaa'
    buffers.push(chunk.header(this._previousChecksum), chunk.buffer)

    this._stderr.write(Buffer.concat(buffers))

    // Setting this to true means no more flush.
    this._writing = true
}

module.exports = Queue
