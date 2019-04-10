require('proof')(7, prove)

function prove (okay) {
    var format = require('..')
    okay(format({
        measurement: 'a',
        fields: { field: 1 }
    }), 'a field=1\n', 'measurement only')
    okay(format({
        measurement: 'a',
        fields: { field: 1 },
        newline: false
    }), 'a field=1', 'no newline')
    okay(format({
        measurement: 'a',
        fields: { field$i: 1 }
    }), 'a field=1i\n', 'integer field')
    okay(format({
        measurement: 'a',
        fields: { field: 1 },
        timestamp: 0
    }), 'a field=1 0\n', 'zero timestamp')
    okay(format({
        measurement: 'a',
        fields: { field: 1 },
        timestamp: -1
    }), 'a field=1 -1000000\n', 'non-zero timestamp')
    okay(format({
        measurement: 'a',
        fields: { field: 1 },
        tags: { tag: 'value' }
    }), 'a,tag=value field=1\n', 'with tags')
    console.log(format({
        measurement: 'a',
        fields: { field: '\'must quote\'' },
        tags: { tag: 'comma,space equals=' },
        newline: false
    }))
    okay(format({
        measurement: 'a',
        fields: { field: '\'must quote\'' },
        tags: { tag: 'comma,space equals=' }
    }), 'a,tag=comma\\,space\\ equals\\= field=\'\\\'must quote\\\'\'\n', 'with tags')
}
