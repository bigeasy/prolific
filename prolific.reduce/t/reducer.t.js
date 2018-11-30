require('proof')(1, prove)

function prove (okay) {
    var Reducer = require('..')
    var reducer = new Reducer({})
    var got = reducer.merge('x', { when: 0, id: 'x' })
    okay(got, {
        when: 0,
        skip: {
            when: true, level: true, label: true, qualified: true, qualifier: true, pid: true
        },
        entry: { when: 0, id: 'x' },
        id: 'x'
    }, 'got')
}
