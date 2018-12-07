var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('now')

function now () {
    return function () {
        var i = 0
        function f () { return Date.now() && 1 }
        return function () {
            i += f()
        }
    }
}

function never () {
    return function () {
        var i = 0
        function f () { return 1 }
        return function () {
            i += f()
        }
    }
}

for (var i = 1; i <= 4; i++)  {
    suite.add({
        name: ' now     ' + i,
        fn: now()
    })

    suite.add({
        name: ' not now ' + i,
        fn: never()
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()
