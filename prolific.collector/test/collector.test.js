require('proof')(2, (okay) => {
    const Collector = require('..')
    {
        const collector = new Collector
        const test = []
        collector.on('data', data => test.push(data.body.method))
        collector.on('notice', message => test.push(message.label))
        collector.data({
            start: 0,
            series: 1,
            when: 0,
            pid: 2,
            body: { method: 'exit' }
        })
        collector.data({
            start: 0,
            series: 0,
            when: 0,
            pid: 2,
            body: { method: 'start' }
        })
        collector.data({
            pid: 2,
            body: { method: 'eos' }
        })
        okay(test, [ 'start', 'exit', 'eos' ], 'ordered')
    }
    {
        const collector = new Collector
        const test = []
        collector.on('data', data => test.push(data.body.method))
        collector.on('notice', message => test.push(message.label))
        collector.data({
            start: 0,
            series: 0,
            when: 0,
            pid: 2,
            body: { method: 'start' }
        })
        collector.data({
            start: 0,
            series: 2,
            when: 0,
            pid: 2,
            body: { method: 'exit' }
        })
        collector.data({
            pid: 2,
            body: { method: 'eos' }
        })
        okay(test, [ 'start', 'gap', 'eos' ], 'ordered')
    }
})
