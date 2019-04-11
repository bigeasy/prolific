require('proof')(2, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/tcp.t')

    destructible.completed.wait(callback)

    var Interlocutor = require('interlocutor')
    var Reactor = require('reactor')
    var cadence = require('cadence')
    var delta = require('delta')
    var Signal = require('signal')

    var connect = require('connect')

    var HTTP = require('..')

    function Service () {
        this.middleware = Reactor.reactor(this, function (configurator) {
            configurator.dispatch('POST /ingress', 'ingress')
        })
        this._signal = new Signal
        this._queue = []
    }

    Service.prototype.ingress = cadence(function (async, request) {
        async(function () {
            delta(async()).ee(request).on('data', []).on('end')
        }, function (chunks) {
            var string = Buffer.concat(chunks).toString()
            string.split('\n').forEach(function (line) {
                if (line.length) {
                    this._queue.push(line)
                    if (line == this._sought) {
                        this._signal.notify()
                    }
                }
            }, this)
        })
    })

    Service.prototype.wait = cadence(function (async, line) {
        async(function () {
            this._sought = line
            this._signal.wait(async())
        }, function () {
            this._sought = null
            return [ this._queue.splice(0, this._queue.length) ]
        })
    })

    var service = new Service

    var interlocutor = new Interlocutor(connect().use(service.middleware))

    cadence(function (async) {
        async(function () {
            destructible.durable('joined', HTTP, {
                fetch: {
                    url: 'http://127.0.0.1:8080/ingress',
                    method: 'POST',
                    http: interlocutor
                },
                join: '\n'
            }, async())
            destructible.durable('individual', HTTP, {
                fetch: {
                    url: 'http://127.0.0.1:8080/ingress',
                    method: 'POST',
                    http: interlocutor
                }
            }, async())
        }, function (joined, individual) {
            async(function () {
                service.wait('c', async())
                joined.send('a')
                joined.send('b')
                joined.send('c')
            }, function (lines) {
                okay(lines, [ 'a', 'b', 'c' ], 'joined')
            }, function () {
                service.wait('c', async())
                individual.send('a')
                individual.send('b')
                individual.send('c')
            }, function (lines) {
                okay(lines, [ 'a', 'b', 'c' ], 'individual')
                joined.destroy()
                joined.send('a')
            })
        })
    })(destructible.durable('test'))
}
