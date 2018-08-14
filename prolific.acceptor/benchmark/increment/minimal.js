var Acceptor = require('../../acceptor')
var Acceptor_ = require('../../acceptor_')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('minimal')

var chain = [{
    path: '.example.service',
    level: 'info',
    accept: true
}, {
    path: '.example.service',
    level: 'debug',
    accept: true
}, {
    path: '.example.service',
    level: 'debug',
    accept: true
}, {
    path: '.example.service',
    level: 'debug',
    accept: true
}]

var acceptor = new Acceptor(true, chain)
var acceptor_ = new Acceptor_(true, chain)

function fn () {
    acceptor.acceptByProperties([{ level: 'info', qualifier: 'example.service' }])
}

function fn_ () {
    acceptor.acceptByProperties([{ level: 'info', qualifier: 'example.service' }])
}

fn()
fn_()

for (var i = 1; i <= 4; i++) {
    suite.add({
        name: 'acceptor  minimal ' + i,
        fn: fn
    })

    suite.add({
        name: 'acceptor_ minimal ' + i,
        fn: fn_
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()
