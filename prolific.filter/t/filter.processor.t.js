require('proof')(1, prove)

function prove (okay, callback) {
    var Processor = require('../filter.processor')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/acceptor.processor.t')

    var cadence = require('cadence')

    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
        }
    }

    destructible.completed.wait(callback)

    destructible.monitor('test', cadence(function (async, destructible) {
        async([function () {
            destructible.destroy()
        }], function() {
            destructible.monitor('Processor', Processor, {
                accept: false,
                chain: [{
                    path: '.bigeasy.prolific',
                    test: '$.name == "foo" && $qualifier[2] == "bigeasy.prolific" && $level == TRACE',
                    accept: true
                }]
            }, sink, async())
        }, function (processor) {
            processor.process({
                json: { name: "foo" },
                path: [ '', 'bigeasy', 'prolific', 'filter' ],
                level: 7,
                qualifier: [
                    null,
                    "bigeasy",
                    "bigeasy.prolific",
                    "bigeasy.prolific.filter"
                ]
            })
            processor.process({
                json: { name: "bar" },
                path: [ '', 'bigeasy', 'prolific', 'filter' ],
                level: 7,
                qualifier: [
                    null,
                    "bigeasy",
                    "bigeasy.prolific",
                    "bigeasy.prolific.filter"
                ]
            })
            okay(sink.gathered, [{
                json: { name: "foo" },
                path: [ '', 'bigeasy', 'prolific', 'filter' ],
                level: 7,
                qualifier: [
                    null,
                    "bigeasy",
                    "bigeasy.prolific",
                    "bigeasy.prolific.filter"
                ]
            }], 'gathered')
        })
    }), null)
}
