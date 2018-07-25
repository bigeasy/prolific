require('proof')(2, prove)

function prove (okay, callback) {
    var Processor = require('..')

    var Destructible = require('destructible')
    var destructible = new Destructible

    var cadence = require('cadence')

    destructible.completed.wait(callback)

    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
        }
    }

    destructible.monitor('test', cadence(function (async) {
        async([function () {
            destructible.destroy()
        }], function () {
            destructible.monitor('Processor', Processor, {}, sink, async())
        }, function (processor) {
            processor.process({
                json: { label: 'count', l2met: 'count', value: 1, tags: { key: 'value' } },
                formatted: []
            })
            processor.process({
                json: { label: 'count', l2met: 'count', value: 1 },
                formatted: []
            })
            processor.process({
                json: { l2met: 'steve' },
                formatted: []
            })
            okay(sink.gathered.shift().formatted[0], 'c#count=1 tags=key:value\n', 'format')
            okay(sink.gathered.shift().formatted[0], 'c#count=1\n', 'format to tags')
        })
    }), null)
}
