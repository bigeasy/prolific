require('proof')(13, prove)

function prove (okay) {
    function scan (buffer) {
        for (var i = 0; i != buffer.length; i = collector.scan(buffer, i)) {
        }
    }

    var chunks = [
        '% 1/2 aaaaaaaa 224e8640 1 %',
        '{"method":"announce","body":1}',
         '% 1/2 224e8640 bb000670 1 %',
        '{"method":"chunk","checksum":1917791070,"chunks":2}',
        '% 1/2 bb000670 c2440b22 0 %',
        '[["abcdefghijklmnopqrstuvwxyz","abcdefghijklmnopqrstuvwxyz","abcdefghij',
        '% 1/2 c2440b22 32c7649f 0 %',
        'klmnopqrstuvwxyz"]]',
        '% 1/2 32c7649f b798da34 1 %',
        '{"method":"exit"}',
        ''
    ]

    var Chunk = require('prolific.chunk')
    var Collector = require('../collector')

    var stream = require('stream')

    var output = new stream.PassThrough

    var collector = new Collector(output, [])

    okay(collector.scan(Buffer.from('err'), 0), 3, 'scanned all')
    okay(collector.scan(Buffer.from('or\n'), 0), 3, 'scanned to newline at end')
    okay(output.read().toString(), 'error\n', 'pass through')

    collector.scan(Buffer.from('% 1/2 00000000 00000000 1 %\n'), 0)
    okay(output.read().toString().split('\n'), [
        '% 1/2 00000000 00000000 1 %',
        ''
    ], 'header with bad start')

    scan(Buffer.from('abc' + chunks.shift() + '\n' + chunks.shift() + '\ndef\n'))
    okay(output.read().toString(), 'abcdef\n', 'pass through interpolated')
    okay(collector.outbox.shift(), {
        method: 'announce',
        id: '1/2',
        body: 1
    }, 'announce')

    scan(Buffer.from('% 1/2 00000000 00000000 1 %\n'))
    okay(output.read().toString().split('\n'), [
        '% 1/2 00000000 00000000 1 %',
        ''
    ], 'header with bad previous checksum')

    scan(Buffer.from(chunks[0] + '\nabcdef\n'))
    okay(output.read().toString().split('\n'), [
        chunks[0],
        'abcdef',
        ''
    ], 'bad body checksum')

    scan(Buffer.from(chunks.join('\n')))

    okay(collector.outbox.shift(), {
        // TODO Rename to `entries`.
        method: 'chunk',
        // TODO Go get a series from Prolific Queue tests.
        series: (function () {})(),
        id: '1/2',
        // TODO Why are they nested like this? See Prolific Queue tests.
        entries: [ [
            'abcdefghijklmnopqrstuvwxyz',
            'abcdefghijklmnopqrstuvwxyz',
            'abcdefghijklmnopqrstuvwxyz',
        ] ]
    }, 'entries')

    okay(collector.outbox.shift(), {
        method: 'exit',
        id: '1/2',
    }, 'exit')

    collector.scan(Buffer.from('error'), 0)
    collector.end()

    okay(output.read().toString(), 'error', 'end of stream no new line')

    var input = new stream.PassThrough
    var output = new stream.PassThrough

    var collector = new Collector(output)
    collector.scan(Buffer.from('error\n'), 0)
    okay(output.read().toString(), 'error\n', 'last line')
    collector.end()
    okay(output.read(), null, 'end of line at end of stream')
}
