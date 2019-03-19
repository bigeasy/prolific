// Node.js API.
var assert = require('assert')

// A fast hash.
var fnv = require('hash.fnv')

// Format a hexadecimal number with leading zeros.
var hex = require('./hex')

// Note that we assume the buffer has a newline appended and our checksum does
// not include the newline.

//
function Chunk (header, id, buffer) {
    assert(Array.isArray(id))
    this.header = header
    this.id = id.join('/')
    this.checksum = fnv(0, buffer, 0, buffer.length)
    this.buffer = buffer
}

// Because we want to fit within `PIPE_BUF` we want to have a simplified header
// with a fixed width so that it is easy to split a buffer knowing an exact size
// for each segment. We no longer length encode the buffer, it must always end
// with a newline. We require that the payload is always JSON, so we know that
// they body will never have newlines itself. We no longer keep track of a
// series number in the header because the character width of the series number
// is variable, we rely on the linked list of the checksums and the fact that
// things are not going to get out of order since writing to standard error is
// synchronous.
//
// The header is of a particular format that ought to not occur naturally in
// standard error output of a production application. We search for this
// particular output at the end of every line in standard error. If we find it
// we look to the next line for the content of the chunk. The checksums mean
// that if we happen to accidentally match something that looks like a header
// but is not a header we're probably not also going to have correct checksums
// so we can forward the header-looking error output to the supervising process'
// standard error.
//
// An id is an array of integers joined by slashes. Used to be anythign but a
// space but with this restriction we can be discerning in our pattern matching.
//
// The header contains a header flag that indicates whether the chunk contains
// control information or body content. The flag is one for true, zero for
// false. This keeps the header a fixed with.
//
// Headers chunks can contain stream control information or indicate the start
// of collection of entries which may be broken up into multiple chunks. Chunks
// containing body content are not headers and have zero value for header.
//
// When we write the chunk we require the checksum of the previous checksum.
// This is printed with the current checksum to form a linked list of chunks.
// The checksums are 32-bit and represented in zero padded hexidecmal so that
// they too are fixed with.
//
// Notes on `PIPE_BUF`. https://serverfault.com/a/733611

//
Chunk.prototype.concat = function (previous) {
    var header = Buffer.from('% ' + this.id + ' ' + hex(previous) + ' ' +
        hex(this.checksum) + ' ' + (this.header ? '1' : '0') + ' %\n')
    return Buffer.concat([ header, this.buffer, Buffer.from('\n') ])
}

// Export the object.
module.exports = Chunk
