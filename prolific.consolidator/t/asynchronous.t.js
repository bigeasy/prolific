require('proof')(2, prove)

function prove (assert) {
    var stream = require('stream')
    var Asynchronous = require('../asynchronous')
    var Chunk = require('prolific.chunk')
    var abend = require('abend')

    var chunk, previousChecksum, buffer

    var entries = []
    var through = new stream.PassThrough
    var asynchronous = new Asynchronous({
        process: function (entry) {
            entries.push(entry)
        }
    })
    asynchronous.listen(through, abend)

    var json = new Buffer(JSON.stringify({
        qualifier: 'prolific.consolidator',
        level: 'warn',
        when: 0
    }) + '\n')

    chunk = new Chunk(1, 0, new Buffer(''), 1)
    write(through, chunk, 'aaaaaaaa')

    previousChecksum = chunk.checksum
    buffer = new Buffer('{}\n')
    chunk = new Chunk(1, 1, json, json.length)
    write(through, chunk, previousChecksum)

    assert(entries.shift(), {
        level: 3,
        when: 0,
        qualifier: [ null, 'prolific', 'prolific.consolidator' ],
        formatted: [],
        json: { when: 0, level: 'warn', qualifier: 'prolific.consolidator' }
    }, 'read chunk')

    asynchronous.consume({
        pid: chunk.pid,
        number: chunk.number,
        previousChecksum: previousChecksum,
        checksum: chunk.checksum,
        buffer: chunk.buffer,
        value: chunk.value
    })

    previousChecksum = chunk.checksum

    json = new Buffer(JSON.stringify({
        qualifier: 'prolific.consolidator',
        level: 'warn',
        when: 0
    }))
    chunk = new Chunk(1, 2, json, json.length)

    asynchronous.consume({
        pid: chunk.pid,
        number: chunk.number,
        previousChecksum: previousChecksum,
        checksum: chunk.checksum,
        buffer: chunk.buffer.toString('utf8'),
        value: chunk.value
    })

    asynchronous.consume({ eos: true })

    asynchronous.exit()

    assert(entries.shift(), {
        level: 3,
        when: 0,
        qualifier: [ null, 'prolific', 'prolific.consolidator' ],
        formatted: [],
        json: { when: 0, level: 'warn', qualifier: 'prolific.consolidator' }
    }, 'read chunk from sync')

    function write (writable, chunk, previousChecksum) {
        writable.write(chunk.header(previousChecksum))
        writable.write(chunk.buffer)
    }
}
