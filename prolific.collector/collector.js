var fnv = require('hash.fnv')
var assert = require('assert')

function Collector (async) {
    this._async = async
    this._buffers = []
    this.chunkNumber = 0
    this._previousChecksum = 0xaaaaaaaa
    this._initializations = 0
    this.chunks = []
    this.stderr = []
    this._state = 'seek'
}

// TODO We control the asynchronous stream, so we know that the messages on that
// stream are for us, but we do not control the synchronous stream, it is going
// to be standard error. We do not want to assert that standard error is used
// for nothing but Prolific logging. That is going to frustrate our dear user
// when our dear user is using a 3rd party library that is beyond our dear
// user's control. Our dear user will be most disappointed in us for this
// stricture. Thus, we need to scan past the noise of ordinary standard error.
// Our messages will be at the very end, the last messages out as we flush the
// logging buffer on exit.
//
// Our header is simple, four integers on a line expressed in UTF-8. It is not
// unlikely for us to find four integers on a line in ordinary standard I/O
// spew. How do we verify that four integers on a line on standard out
// constitute a Prolific logging header and not some arbitrary spew?
//
// We could gather the numbers and then use the sequence. If it is less than the
// current sequence, we ignore it. If it is greater, we wait for the sequence to
// arrive on the async logging output, then check the checksums before
// proceeding. The problem is that the header might be arbitrary spew and the
// spewed sequence number might be impossibly high, which means that we're going
// to block standard error for a long, long time.
//
// We could put a distance limit, but that is an arbitrary limit, so we're
// hoping for the best. What if there are logging messages on the async log are
// coming slow while spew on standard error is coming fast? This is highly
// likely in some degenerate states. We really want to be a deterministic as
// possible, which is probalby a misuse of the word deterministic, given how
// vital we are to diagnosing unreproducable errors.
//
// We could gather up the buffer, then let the bits flow again. Problem there is
// that an arbitrary spew header would have an aribtrary length that might
// swallow the actual header, so we're going to need to back track, and now
// we're consuming memory, not for buffering, but for retention, which we do not
// want to do.
//
// What I've come up with is this; the stream state is one where it goes from an
// aribitrary stream to a Prolific stream. The asynchronous stream begins as a
// Prolific stream. While the program is running it is the source of logging
// messages, the synchronous is emitting arbitrary blather. When the program
// ends the  synchronous stream will switch and when it does it takes over as
// the source of logging messages. It could still have abitrary blather in it
// that we must skip, but the Prolific messages will come in contiguous headers
// and chunks.
//
// To keep from swallowing, the initial message on the synchronous stream is a
// zero length message. The previous checksum references the initial checksum.
// The current checksum is the , ah! The first message in a stream is a previous
// checksum.
//
Collector.prototype.scan = function (buffer) {
    var scan = { buffer: buffer, index: 0 }, scanned = true
    while (scanned) {
        switch (this._state) {
        case 'seek':
            scanned = this._seek(scan)
            break
        case 'header':
            scanned = this._scanHeader(scan)
            break
        case 'chunk':
            scanned = this._scanChunk(scan)
            break
        }
    }
    if (scan.index < scan.buffer.length) {
        this._buffers.push(new Buffer(buffer.slice(scan.index)))
    }
}

Collector.prototype._scanChunk = function (scan) {
    var remaining = Math.min(this._chunk.remaining, scan.buffer.length - scan.index)
    this._buffers.push(new Buffer(scan.buffer.slice(scan.index, scan.index + remaining)))
    scan.index += remaining
    if ((this._chunk.remaining -= remaining) == 0) {
        var buffer = Buffer.concat(this._buffers)
        this._buffers.length = 0
        var checksum = fnv(0, buffer, 0, buffer.length)
        assert(checksum == this._chunk.checksum, 'invalid checksum')
        this.chunks.push({
            number: this._chunk.number,
            previousChecksum: this._previousChecksum,
            checksum: this._chunk.checksum,
            length: this._chunk.length,
            buffer: buffer
        })
        this._chunk = null
        this._state = 'seek'
        this.chunkNumber++
        return true
    }
    return false
}

Collector.prototype._push = function (scan, i) {
    this._buffers.push(new Buffer(scan.buffer.slice(scan.index, i)))
    scan.index = i
}

Collector.prototype._flush = function () {
    return Buffer.concat(this._buffers.splice(0, this._buffers.length))
}

Collector.prototype._scanned = function (scan, i) {
    this._push(scan, i)
    var scanned = this._flush()
    if (scanned.length != 0) {
        assert(!this._async, 'garbage before header')
        this.stderr.push(scanned)
    }
}

Collector.prototype._seek = function (scan) {
    for (var buffer = scan.buffer, i = scan.index, I = buffer.length; i < I; i++) {
        if (buffer[i] == 0x25) {
            this._state = 'header'
            this._scanned(scan, i)
            return true
        } else if (buffer[i] == 0xa) {
            this._scanned(scan, i + 1)
            return true
        }
    }
    return false
}

// TODO How do you really debug a problem with a stream? You need more than a
// stack trace, you need a sample of the stream.
//
// TODO Some more theory. The checksums here only exist to detect the switch
// between the logging stream and the final message from standard out. The
// likelihood of corruption on a unix pipe between parent and child is slim, our
// ability to anything reasonable in the face of such corruption is
// non-existant.
//
// TODO Here we are revisiting a balance between correctness and complexity,
// essentally answering an admonishment, when I believe that the answer I've
// come to is that adding code doesn't add stability. Stability comes from
// deployment first, and then the passage of time.
Collector.prototype._scanHeader = function (scan) {
    for (var buffer = scan.buffer, i = scan.index, I = buffer.length; i < I; i++) {
        if (buffer[i] == 0xa) {
            break
        }
    }
    if (i != I) {
        this._push(scan, i + 1)
        var header = this._flush()
        var $ = /^% (\d+) ([0-9a-f]{8}) ([0-9a-f]{8}) (\d+)\n$/i.exec(header.toString())
        if ($) {
            var chunk = {
                number: +$[1],
                checksum: parseInt($[3], 16),
                length: +$[4],
                remaining: +$[4]
            }
            var previousChecksum = parseInt($[2], 16)
            if (previousChecksum == this._previousChecksum) {
                if (chunk.number == 0) {
                    if (this._initializations == 0 || (this._initializations == 1 && !this._async)) {
                        this.chunkNumber = chunk.remaining
                        this._previousChecksum = chunk.checksum
                        this._initializations++
                    } else {
                        assert(!this._async, 'already initialized')
                    }
                } else if (chunk.number == this.chunkNumber) {
                    this._state = 'chunk'
                    this._chunk = chunk
                    this._previousChecksum = chunk.checksum
                } else {
                    assert(!this._async, 'chunk numbers incorrect')
                }
            } else {
                assert(!this._async, 'async stream sequence break')
                this.stderr.push(header)
            }
        } else {
            assert(!this._async, 'async stream garbled header')
            this.stderr.push(header)
        }
        return true
    }
    return false
}

module.exports = Collector
