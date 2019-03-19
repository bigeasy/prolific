var fnv = require('hash.fnv')
var assert = require('assert')

function Collector (stderr, outbox) {
    this._channels = {}
    this._stderr = stderr
    this.outbox = outbox
}

Collector.prototype._chunk = function (matched, buffer) {
    if (matched.header) {
        var json = JSON.parse(buffer.toString())
        switch (json.method) {
        case 'announce':
            assert(this._channels[json.id] == null)
            this._channels[matched.id] = {
                chunk: null,
                checksum: matched.checksum
            }
            this.outbox.push({
                method: 'announce',
                id: matched.id,
                body: json.body
            })
            break
        case 'chunk':
            assert(this._channels[matched.id] != null)
            this._channels[matched.id].chunk = {
                checksum: json.checksum,
                series: json.series,
                chunks: json.chunks,
                index: 0,
                buffers: []
            }
            this._channels[matched.id].checksum = matched.checksum
            break
        case 'exit':
            assert(this._channels[matched.id] != null)
            assert(this._channels[matched.id].chunk == null)
            delete this._channels[matched.id]
            this.outbox.push({ method: 'exit', id: matched.id })
            break
        }
    } else {
        var chunk = this._channels[matched.id].chunk
        chunk.buffers.push(buffer)
        chunk.index++
        if (chunk.index == chunk.chunks) {
            this._channels[matched.id].chunk = null
            var buffer = Buffer.concat(chunk.buffers)
            var checksum = fnv(0, buffer, 0, buffer.length)
            assert(checksum == chunk.checksum)
            this.outbox.push({
                method: 'chunk',
                id: matched.id,
                series: matched.series,
                entries: JSON.parse(buffer.toString())
            })
        }
        this._channels[matched.id].checksum = matched.checksum
    }
}

// Because we only write chunks that are `PIPE_BUF` or smaller, we know that
// they will always be complete in the standard output stream. We cannot rely on
// them being on their own line however. They maybe be interpolated into then
// non-chunk standard output spew of another child process so that the headers
// do not start on a new line, rather they start in the middle of someone else's
// line. When this happens, we do know that they will be at the end of the line
// because they will be written entirely and thier newline character will break
// the line they've been dropped into. Thus, we can search for our headers at
// the end of each line in standard output where, for the most part,  the end of
// the line starts at the very beginning of the line.
//
// We write the stuff before the header to standard error. Again, this is going
// be an empty string more often than not.

//

Collector.prototype.scan = function (buffer, offset) {
    for (var i = offset, I = buffer.length; i < I; i++) {
        if (buffer[i] == 0xa) {
            if (this._remainder != null) {
                this._readLine(Buffer.concat([ this._remainder, buffer.slice(offset, i) ]), true)
                this._remainder = null
            } else {
                this._readLine(buffer.slice(offset, i), true)
            }
            return i + 1
        }
    }
    this._remainder = Buffer.from(buffer.slice(offset, buffer.length))
    return i
}

Collector.prototype.end = function () {
    if (this._remainder != null) {
        this._readLine(this._remainder, false)
        this._remainder = null
    }
}

Collector.prototype._writeStandardError = function (line, newline) {
    this._stderr.write(line)
    if (newline) {
        this._stderr.write('\n')
    }
}

Collector.prototype._readLine = function (line, newline) {
    if (this.matched == null) {
        line = line.toString()
        var $ = /^(.*)% (\d+\/\d+) ([0-9a-f]{8}) ([0-9a-f]{8}) ([10]) %$/i.exec(line)
        if ($) {
            this.matched = {
                line: line,
                preceding: $[1],
                id: $[2],
                checksum: $[4],
                previous: $[3],
                header: $[5] == '1'
            }
            if (
                (
                    this._channels[this.matched.id] != null &&
                    this._channels[this.matched.id].checksum == this.matched.previous
                )
                ||
                this.matched.previous == 'aaaaaaaa'
            ) {
                return
            }
        }
        this.matched = null
        this._writeStandardError(line, newline)
    } else {
        var checksum = fnv(0, line, 0, line.length)
        if (checksum == parseInt(this.matched.checksum, 16)) {
            this._writeStandardError(this.matched.preceding, false)
            this._chunk(this.matched, line)
        } else {
            this._writeStandardError(this.matched.line, true)
            this._writeStandardError(line, newline)
        }
        this.matched = null
    }
}

module.exports = Collector
