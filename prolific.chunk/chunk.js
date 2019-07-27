// In order to prevent interpolation of our tunneled stream with standard error
// messages from other child processes, we must ensure that our formatted
// `Chunk` fits with a `PIPE_BUF`. We end every formatted `Chunk` with a
// newline. Now we can parse a standard error shared by multiple child processes
// by line and look for our formatted `Chunk`s at the end of each line. However,
// more often than not the `Chunk` will begin at the first character in the
// line.
//
// Because our formatted `Chunk` is less than the length of `PIPE_BUF` we know
// that no other child process will be able to interploate their standard error
// output into our formatted `Chunk` text. On the other hand, we might inject
// our formatted `Chunk` into the standard output spew of another child process.
// Because the formatted `Chunk` ends with a newline we know that our formatted
// `Chunk` will always occur at the end of an interplated line. We search for it
// with a regular expression that matches the pecular header that begins with
// `%` and has a well defined pattern of a slash-delimited numeric id followed
// by to hexidecimal checksums.
//
// With this we're able to use standard error as a common synchronous channel
// for multi-process applications.
//
// Because we want to fit within `PIPE_BUF` we want to have a simplified header
// with a fixed width so that it is easy to split a buffer knowing an exact size
// for each segment. The buffer is not length-encoded. It must always end with a
// newline. We require that the payload is always a single line of JSON, so we
// know that they body will never have newlines itself. We no longer keep track
// of a series number in the header because the character width of the series
// number is variable, we rely on the linked list of the checksums and the fact
// that things are not going to get out of order since writing to standard error
// is synchronous.
//
// The header is of a peculiar format that ought to not occur naturally in
// standard error output of a production application. We search for this
// peculiar output at the end of every line in standard error. If we find it we
// look to the next line for the content of the chunk. The checksums mean that
// if we happen to accidentally match something that looks like a header but is
// not a header we're probably going to have a checksum mismatch so that the
// chances of a false positive are slim. We'll forward the header-looking line
// to standard error.
//
// Note that we're only going to be tunneling through standard out after the
// pipe closes, which should only be during program shutdown. There is not a lot
// of opportunity for a false positive and it wouldn't corrupt a stream of a
// running application.
//
// An id is an array of integers joined by slashes. Used to be anything but a
// space but with this restriction we can be discerning in our pattern matching.
//
// The header contains a control flag that indicates whether the chunk contains
// control information or body content. The flag is one for true, zero for
// false. The single character flags keeps the header a fixed with.
//
// Control chunks can contain stream control information or indicate the start
// of collection of entries which may be broken up into multiple chunks. Chunks
// containing body content are not control chunks and have zero value for
// control in the header.
//
// When we write the chunk we require the checksum of the previous checksum.
// This is printed with the current checksum to form a linked list of chunks.
// The checksums are 32-bit and represented in zero padded hexadecimal so that
// they too are fixed with.
//
// Notes on `PIPE_BUF`. https://serverfault.com/a/733611

// Node.js API.
const assert = require('assert')

// A fast non-cryptogrpahic 32-bit hash.
const fnv = require('hash.fnv')

// Format a hexadecimal number with leading zeros.
const hex = require('./hex')

// `Chunk` &mdash; encodes a single line of our tunneled standard error message
// format.

//
class Chunk {
    // `const chunk = new Chunk(control, id, buffer)` &mdash; Create a `Chunk`.
    //
    // * `control` &mdash; `boolean` indicating a control chunk if `true`.
    // * `id` &mdash; an identifier consisting of an `Array` of numeric
    // characters.
    // * `buffer` &mdash; the `Buffer` payload.
    //
    // The `buffer` can contain any character except the newline character
    // because the chunks are newline delimited.

    //
    constructor (control, id, buffer) {
        assert(Array.isArray(id))
        this.control = control
        this.id = id.join('/')
        this.checksum = fnv(0, buffer, 0, buffer.length)
        this.buffer = buffer
    }

    // `chunk.concat(previous)` &mdash; Create a buffer from the `Chunk`.
    //
    // * `previous` &mdash; integer value 32-bit hash of the previous `Chunk`.

    //
    concat (previous) {
        const header = Buffer.from(`% ${this.id} ${hex(this.checksum)}` +
            ` ${hex(previous)} ${(this.control ? '1' : '0')} %\n`)
        return Buffer.concat([ header, this.buffer, Buffer.from('\n') ])
    }

    // `Chunk.getBodySize(pipeBuf, id) &mdash; Calculate the space available in
    // a chunk for the chunk body for a given `PIPE_BUF` size.
    //
    // * `pipeBuf` &mdash; length of `PIPE_BUF`.
    // * `id` &mdash; an identifier consisting of an `Array` of numeric
    // characters.

    //
    static getBodySize (pipeBuf, id) {
        assert(Array.isArray(id))
        const headerSize = id.join('/').length +  // length of id
                          (8 * 2) +               // two checksums
                          2 +                     // two % borders
                          1 +                     // control flag
                          2 +                     // two newlines
                          5                       // five spaces in header
        return pipeBuf - headerSize
    }
}

// Export the object.
module.exports = Chunk
