var Benchmark = require('benchmark')
var suite = new Benchmark.Suite('minimal')

var properties = [{
    when: 0,
    level: 'debug',
    pid: 0,
    qualifier: 'qualifier',
    label: 'label',
    qualified: 'qualifier#label'
}, {
    array: [],
    tags: [],
    url: '/',
    headers: {},
    body: 'x'
}, {
    name: 'steve',
    object: {}
}, {
}]

function triage (header, body, system, append) {
    append.put = 1
    return [ header.when, body.array, system.name, append.put ]
}

function p (properties) {
        properties.set('put', 1)
        return [ properties.get('when'), properties.get('array'),
        properties.get('name'), properties.get('put') ]
}

function o (object) {
    object.put = 1
    return [ object.when, object.array, object.name, object.put ]
}

var Properties = require('../../properties')

var get = {
    triage: function () {
        triage(properties[0], properties[1], properties[2], {})
    },
    properties: function () {
        p(new Properties(properties))
    },
    compose: function () {
        var object = {}
        for (var i = 0, I = properties.length; i < I; i++ ) {
            for (var key in properties[i]) {
                object[key] = properties[i][key]
            }
        }
        o(object)
    }
}

get.properties()
get.compose()

for (var i = 1; i <= 4; i++) {
    suite.add({
        name: 'properties ' + i,
        fn: get.properties
    })

    suite.add({
        name: 'compose ' + i,
        fn: get.compose
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()
