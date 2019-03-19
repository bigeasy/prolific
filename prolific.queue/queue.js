var assert = require('assert')

var cadence = require('cadence')
var Signal = require('signal')

var fnv = require('hash.fnv')

var Chunk = require('prolific.chunk')

var split = require('./split')

function Queue (size, id, stderr, announcement) {
    this._id = id
    this._size = Chunk.getBodySize(size, id)
    this._series = 1
    this._signal = new Signal
    this._entries = []
    this._batches = []
    this._checksum = 0xaaaaaaaa
    var self = this
    this._stream = { end: function () {} }
    this._writing = true
    this._piped = false
    this._sync = false
    this._exited = false
    this._stderr = stderr
    // Announce the child process to the supervisor. This will inform the
    // supervisor that this child exists and that it may at some point send
    // messages through chunks on standard error.
    this._writeSync(new Chunk(true, this._id, Buffer.from(JSON.stringify({
        method: 'announce',
        body: announcement
    }))))
}

Queue.prototype._writeSync = function (chunk) {
    assert(chunk.buffer.length <= this._size)
    this._stderr.write(chunk.concat(this._checksum))
    this._checksum = chunk.checksum
}

// Set the asynchronous pipe and begin streaming entries or else close the pipe
// if it has arrived after we've closed.

//
Queue.prototype.setPipe = function (stream) {
    if (this._sync) {
        stream.end()
    } else {
        this._stream = stream
        this._piped = true
        if (this._entries.length) {
            this._batchEntries()
            this._signal.notify()
        } else {
            this._writing = false
        }
    }
}

Queue.prototype._batchEntries = function () {
    var entries = this._entries
    if (entries.length == 0) {
        return
    }
    this._entries = []
    this._batches.push({
        series: this._series++,
        buffer: Buffer.from(JSON.stringify(entries) + '\n')
    })
}

Queue.prototype.push = function (json) {
    this._entries.push(json)
    if (this._sync) {
        this._batchEntries()
        this._sendSync()
    } else if (!this._writing) {
        this._writing = true
        this._batchEntries()
        this._signal.notify()
    }
}

// Flush logs to the dedicated logging pipe. Chunks entries so that we can send
// many lines in a single chunk. Then writes. When it comes back from a write it
// checks to see if the pipe has ended and breaks early, otherwise it continues
// until there are no lines or chunks to _sendAsync.

// Note that the first time through we're going to not have any entries and
// wait but we don't want to mark ourselves as not writing because we want to
// keep `push` from signalling us until we get the pipe.

// So, first time through we don't mean it.

//
Queue.prototype.send = cadence(function (async) {
    async.loop([], function () {
        async(function () {
            if (this._entries.length == 0) {
                this._writing = ! this._piped
                this._signal.wait(async())
            } else {
                this._batchEntries()
            }
        }, function () {
            if (this._sync) {
                return [ async.break ]
            }
            assert(this._batches.length == 1)
            async(function () {
                this._stream.write(this._batches[0].buffer, async())
            }, function () {
                this._batches.shift()
            })
        })
    })
})

// Prolific has wrestled long and hard with the confusing available Node.js
// events for program shutdown. It was born of a desire to capture the fatal
// stack trace from a Node.js process and send it to a networked logging
// infrastructure. It was born from a frustration with the brutal performance of
// the "best practice" logging to standard out when standard out is synchronous
// in Node.js. We want to log somewhere asynchronously when times are good for
// performance, but we want to log somewhere synchronously when times are bad
// because there might not be another tick available to talk to the network.

// The "uncaughtException" handler is a final handler, or it should be. You
// should do something synchronous then rethrow the error. This is where
// Prolific began. Writing that error to standard error in such a way that a
// monitor could forward it to the network.

// It seemed then that the "exit" handler was the place to handle ordinary exit,
// and that hooking the "exit" handler would be a way to allow Prolific to
// shutdown normally by writing it's shutdown messages to standard error.

// However, default handlers for `SIGTERM` and `SIGINT` do not invoke `"exit"`.
// `"exit"` is really a work-queue-had-drained event, not an exit event.
// `SIGTERM` and `SIGINT` halt the program without working through the work
// queue. This came as a surprise. It's something that I forget about until I
// return to work on Prolific and wonder how it ever became so complicated.

// This caused me to create a lot of options and to find ways to determine the
// exit of a child process from the monitor.

// However, in the sort of network programming where I want to log to a
// networked logger I always hook `SIGTERM` and `SIGINT` and endeavor to unwind
// my work queue myself. If I can't unwind the work queue, I throw an exception.
// This means I'm always going to reach either `"uncaughtExcpetion"` or
// `"exit"`.

// This initial confusion about `"exit"` lead me to hedge against other
// behaviors that might surprise me. Time has passed and here's what I figure.

// If you need really robust multi-process logging, then defeat those signal
// handlers and unwind your program. If it can't unwind then that is an
// exception. I have a library called Destructible that throws an uncatchable
// exception with an elaborate stack trace that shows which operations blocked
// exit.

// If you really want a quick and dirty client I can probably detect that you're
// done from the supervisor when your child exits, so long as you're not having
// children wink in and out of existence. But that's unlikely for a program like
// a command line utlity where you might want to have Node.js just scram your
// work queue when you exit.

//

// Close the asynchronous pipe and log chunks to standard error. This needs to
// be called in response to `SIGTERM` or else the asynchronous pipe will keep
// the program from exiting.

//
Queue.prototype.close = function () {
    if (this._sync) {
        return
    }

    this._sync = true
    this._signal.unlatch()
    this._stream.end()

    this._batchEntries()
    this._sendSync()
}

// Breaking up long buffers.

// TODO First, we need to prepend a new line so that if our write is interleaved
// in the output of another process that intends to write a large buffer to
// standard error. This is not unlikely given the size of the exception stack
// traces generated by your `Interrupt` library. With a preceding newline we
// would be able to spot the start of our chunk. We could then discard the
// preceding newline and not print it to standard error.

// TODO Second, we need to split up chunks so that the fit with `PIPE_BUF`. This
// splitting is going to happen often on OS X where `PIPE_BUF` is a mere 512
// bytes. Splitting lines is going to be made difficult by Unicode. If there are
// Unicode characters we don't want to split in the middle of character because
// we want to write valid UTF-8 to standard error. Looked around a bit for a
// utility, then looked a Unicode and remembered that I'd done this before.
// That is, I'd looked for a utility then realized that finding the start of a
// Unicode character is trivial.

// Send a group of entries inside chunks on standard error. We need to split the
// entires JSON up into chunks that will fit in `PIPE_BUF` sized buffers so that
// our writes to standard error are atomic and our chunks are not broken up by
// the output of other processes.

// For each entries array JSON we first write a control chunk that contains a
// checksum of the JSON and a count of subsequent body content chunks that will
// contain the JSON. We then write out the body content chunks.

// There's some description of the chunk format in the `chunk.js` file in the
// `prolific.chunk` project.

//
Queue.prototype._sendSync = function () {
    if (this._exited) {
        return
    }
    var buffers = []
    while (this._batches.length) {
        var batch = this._batches.shift()
        var buffer = batch.buffer.slice(0, batch.buffer.length - 1)
        var chunks = []
        var begin = 0
        while (begin < buffer.length) {
            var end = split(buffer, begin + Math.min(this._size, buffer.length - begin))
            chunks.push(new Chunk(false, this._id, buffer.slice(begin, end)))
            begin = end
        }
        this._writeSync(new Chunk(true, this._id, Buffer.from(JSON.stringify({
            method: 'chunk',
            checksum: fnv(0, buffer, 0, buffer.length),
            chunks: chunks.length
        }))))
        chunks.forEach(function (chunk) { this._writeSync(chunk) }, this)
    }
}

// If you can tell the supervior that you are leaving, that would be very nice.

//
Queue.prototype.exit = function () {
    if (!this._exited) {
        this.close()
        this._batchEntries()
        this._sendSync()
        this._writeSync(new Chunk(true, this._id, Buffer.from(JSON.stringify({ method: 'exit' }))))
        this._exited = true
        this._entries = { push: function () {} }
    }
}

module.exports = Queue
