const Benchmark = require('benchmark')

// Test whether using a function is a namespace is going to impose a cost on
// performance when looking up an item in the namespace. It appears that all of
// the lookup operations below are relatively similar in performance.
//
// Oddly, at the time of writing, the loaded function is the fastest in the
// benchmarks, but I'm going to treat that as indicating that the difference
// between object and function property lookup is negligible, not that loaded
// functions are what V8 likes best of all.

const suite = new Benchmark.Suite('invoke', { minSamples: 100 })

function triage () { }

const processor = { triage: function () { } }

const func = {
    f: function () { triage() }

}
const method = {
    f: function () { processor.triage() }
}

for (let i = 0; i < 4; i++) {
    suite.add({
        name: `method ${i}`,
        fn: function () {
            method.f()
        }
    })

    suite.add({
        name: `function ${i}`,
        fn: function () {
            func.f()
        }
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()
