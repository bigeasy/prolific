require('proof')(1, prove)

function prove (okay, callback) {
    var Processor = require('..')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/sequence.processor.t')

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
        }], function () {
            destructible.monitor('first', Processor, { name: 'counter' }, sink, async())
        }, function (processor) {
            processor.process({ json: {} })
            destructible.monitor('second', Processor, { name: 'counter' }, sink, async())
        }, function (processor) {
            processor.process({ json: {} })
            okay(sink.gathered, [{
                json: { sequence: 0 }
            }, {
                json: { sequence: 1 }
            }], 'sequenced')
        })
    }), null)
}
