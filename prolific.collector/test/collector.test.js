describe('collector', () => {
    const assert = require('assert')
    const Collector = require('..')
    it('can order synchronous messages', () => {
        const collector = new Collector
        const test = []
        collector.on('data', data => test.push(data.name))
        collector.on('notice', message => test.push(message.label))
        collector.data({
            start: 0,
            series: 1,
            when: 0,
            path: [ 1, 2 ],
            name: 'exit'
        })
        collector.data({
            start: 0,
            series: 0,
            when: 0,
            path: [ 1, 2 ],
            name: 'start'
        })
        collector.exit(2)
        assert.deepStrictEqual(test, [ 'start', 'exit' ], 'ordered')
    })
    it('can exit with missing messages', () => {
        const collector = new Collector
        const test = []
        collector.on('data', data => test.push(data.name))
        collector.on('notice', message => test.push(message.label))
        collector.data({
            start: 0,
            series: 0,
            when: 0,
            path: [ 1, 2 ],
            name: 'start'
        })
        collector.data({
            start: 0,
            series: 2,
            when: 0,
            path: [ 1, 2 ],
            name: 'exit'
        })
        collector.exit(2)
        assert.deepStrictEqual(test, [ 'start', 'gap' ], 'ordered')
    })
})
