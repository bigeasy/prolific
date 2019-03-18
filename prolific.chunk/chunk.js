// A fast hash.
var fnv = require('hash.fnv')

// Format a hexadecimal number with leading zeros.
var hex = require('./hex')

// Note that we assume the buffer has a newline appended and our checksum does
// not include the newline.

//
function Chunk (id, count, buffer) {
    this.id = id
    this.count = count
    this.checksum = hex(fnv(0, buffer, 0, buffer.length - 1), 8)
    this.buffer = buffer
}

// Because we want to fit within `PIPE_BUF` we want to have a simplified header
// with a fixed width so that it is easy to split a buffer knowing an exact size
// for each segment. We no longer length encode the buffer, it must always end
// with a newline. We require that the payload is always JSON, so we know that
// they body will never have newlines itself. We no longer keep track of a
// series number in the header since its character width is variable, we rely on
// the linked list of the checksums.
//
// There was a value in the header that was used to encode length for ordinary
// bodies and for headers it might indicate the previous series number when
// continuing a closed monitor socket from standard error. We'd detect a new
// stream with a zero series number and assert that the previous checksum was a
// constant value. We can indicate a header by detecting an id that has not yet
// been used instead.
//
// We do have one variable entry which is a chunk count. For our happy path
// socket it will always be `1`. When it comes time to split things up for
// writing on standard error, the first entry of a split entry will be the count
// of chunks including the first chunk. For subsequent chunks the value is
// always a single digit, `1` for for all chunks except the final chunk which
// will be `0`.
//
// Notes on `PIPE_BUF`. https://serverfault.com/a/733611

//
Chunk.prototype.header = function (previousChecksum, length) {
    return Buffer.from('\n% ' + this.id + ' ' + previousChecksum +
        ' ' + this.checksum + ' ' + this.count + '\n')
}

// Export the object.
module.exports = Chunk
