var Benchmark = require('benchmark')
var delimited = require('./delimited')
var alphabet = require('./alphabet')

var suite = new Benchmark.Suite('loop', { minSamples: 100 })
console.log(delimited)

            delimited.deserialize(delimited.serialize(alphabet))
for (var i = 1; i <= 4; i++) {
    suite.add({
        name: ' json ' + i,
        fn: function () {
            JSON.parse(JSON.stringify(alphabet))
        }
    })

    suite.add({
        name: 'delimited ' + i,
        fn: function () {
            delimited.deserialize(delimited.serialize(alphabet))
        }
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
