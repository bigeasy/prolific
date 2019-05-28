describe('collector', () => {
    const assert = require('assert')
    const stream = require('stream')
    const chunks = [
        '% 1/2 224e8640 aaaaaaaa 1 %',
        '{"method":"announce","body":1}',
         '% 1/2 a8d518e8 224e8640 1 %',
        '{"method":"entries","series":1,"checksum":3417670023,"chunks":2}',
        '% 1/2 a6a72ac5 a8d518e8 0 %',
        '[{"alphabet":["abcdefghijklmnopqrstuvwxyz","abcdefghijklmnopqrstuvwxyz"',
        '% 1/2 c1e07487 a6a72ac5 0 %',
        ',"abcdefghijklmnopqrstuvwxyz"]}]',
        '% 1/2 b798da34 c1e07487 1 %',
        '{"method":"exit"}',
        ''
    ]
    const Collector = require('../collector')
    it('can collect chunks', () => {
        const output = new stream.PassThrough

        const collector = new Collector(output, [])

        collector.scan(Buffer.from('err'))
        collector.scan(Buffer.from('or\n'))
        assert.equal(output.read().toString(), 'error\n', 'pass through')

        collector.scan(Buffer.from('% 1/2 00000000 00000000 1 %\n'))
        assert.deepStrictEqual(output.read().toString().split('\n'), [
            '% 1/2 00000000 00000000 1 %',
            ''
        ], 'header with bad start')

        collector.scan(Buffer.from(`abc${chunks[0]}\n${chunks[1]}\ndef\n`))
        assert.equal(output.read().toString(), 'abcdef\n', 'pass through interpolated')
        assert.deepStrictEqual(collector.outbox.shift(), {
            method: 'announce',
            id: '1/2',
            body: 1
        }, 'announce')

        collector.scan(Buffer.from('% 1/2 00000000 00000000 1 %\n'))
        assert.deepStrictEqual(output.read().toString().split('\n'), [
            '% 1/2 00000000 00000000 1 %',
            ''
        ], 'header with bad previous checksum')

        collector.scan(Buffer.from(chunks[2] + '\nabcdef\n'))
        assert.deepStrictEqual(output.read().toString().split('\n'), [
            chunks[2],
            'abcdef',
            ''
        ], 'bad body checksum')

        collector.scan(Buffer.from(chunks.slice(2).join('\n')))

        assert.deepStrictEqual(collector.outbox.shift(), {
            method: 'entries',
            series: 1,
            id: '1/2',
            entries: [{
                alphabet: [
                    'abcdefghijklmnopqrstuvwxyz',
                    'abcdefghijklmnopqrstuvwxyz',
                    'abcdefghijklmnopqrstuvwxyz'
                ]
            }]
        }, 'entries')

        assert.deepStrictEqual(collector.outbox.shift(), {
            method: 'exit',
            id: '1/2',
        }, 'exit')

        collector.end()
        assert.equal(output.read(), null, 'end of line at end of stream')
    })
    it('can terminate partial matches at stream end', () => {
        const output = new stream.PassThrough
        const collector = new Collector(output)
        collector.scan(Buffer.from(chunks[0] + '\n'))
        collector.scan(Buffer.from(chunks[1].substring(0, 3)))
        collector.end()
        assert.deepStrictEqual(output.read().toString().split('\n'), [
            chunks[0],
            '{"m'
        ], 'end during match with no newline at end of file')
    })
})
