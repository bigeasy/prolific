require('proof')(4, require('cadence')(prove))

function prove (async, okay) {
    var stream = require('stream')
    var Synchronous = require('../synchronous')
    var Chunk = require('prolific.chunk')
    var abend = require('abend')

    var chunk, previousChecksum, buffer

    var chunks = [ [], [] ]

    var through = new stream.PassThrough
    var forward = new stream.PassThrough
    var synchronous = new Synchronous(function (chunk) {
        synchronous.setConsumer(chunk.id, {
            consume: function (chunk) { chunks[+chunk.id].push(chunk) }
        })
    })

    synchronous.listen(through, forward, abend)

    through.write('hello, world\n')

    chunk = new Chunk(0, 0, Buffer.from(''), 1)
    write(through, chunk, 'aaaaaaaa')

    previousChecksum = chunk.checksum
    buffer = Buffer.from('a\n')
    chunk = new Chunk(0, 1, buffer, buffer.length)
    write(through, chunk, previousChecksum)

    chunk = new Chunk(1, 0, Buffer.from(''), 1)
    write(through, chunk, 'aaaaaaaa')

    previousChecksum = chunk.checksum
    buffer = Buffer.from('a\n')
    chunk = new Chunk(1, 1, buffer, buffer.length)
    var consumer
    async(function () {
        write(through, chunk, previousChecksum, async())
    }, function () {
        okay(forward.read().toString(), 'hello, world\n', 'through')

        consumer = {
            chunks: [],
            consume: function (chunk) {
                this.chunks.push(chunk)
            }
        }

        okay(chunks[1].shift().buffer.toString(), 'a\n', 'consumer join')

        previousChecksum = chunk.checksum
        buffer = Buffer.from('b\n')
        chunk = new Chunk(1, 2, buffer, buffer.length)
        write(through, chunk, previousChecksum, async())
    }, function () {
        okay(chunks[1].shift().buffer.toString(), 'b\n', 'consumer consume')

        previousChecksum = chunk.checksum
        chunk = new Chunk(1, 3, Buffer.from(''), 0)
        chunk.checksum = 'aaaaaaaa'
        write(through, chunk, previousChecksum, async())
    }, function () {
        through.end()
    }, function () {
        synchronous.clearConsumer(0)
        okay(Object.keys(synchronous._consumers), [], 'deleted consumer')
    })

    function write (writable, chunk, previousChecksum, callback) {
        writable.write(chunk.header(previousChecksum))
        writable.write(chunk.buffer, callback)
    }
}
