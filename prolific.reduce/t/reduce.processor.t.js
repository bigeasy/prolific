require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Processor = require('../reduce.processor')
    var wait = null
    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
            if (entry.json.callback) {
                okay(this.gathered, [{
                    json: {}
                }, {
                    json: {
                        instance: 1,
                        start: 0,
                        end: 1,
                        ended: true,
                        qualified: 'prolific.example#start',
                        name: 'steve',
                        array: [ 'a', 'b' ]
                    }
                }, {
                    json: {
                        callback: true
                    }
                }], 'reduce')
                wait()
            }
        }
    }

    var cadence = require('cadence')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/reduce.processor.t')

    destructible.completed.wait(async())

    async([function () {
        destructible.destroy()
    }], function () {
        destructible.monitor('processor', Processor, {
            pivot: '$.instance',
            end: '$.ended',
            delay: 250
        }, sink, async())
    }, function (processor) {
        async(function () {
            processor.process({ json: { } })
            processor.process({
                json: {
                    instance: 1,
                    start: 0,
                    qualified: 'prolific.example#start',
                    array: [ 'a' ]
                }
            })
            processor.process({
                json: {
                    instance: 1,
                    start: 1,
                    end: 1,
                    ended: true,
                    qualified: 'prolific.example#end',
                    array: [ 'b' ]
                }
            })
            processor.process({
                json: {
                    instance: 1,
                    name: 'steve',
                    qualified: 'prolific.example#name'
                }
            })
            setTimeout(async(), 350)
        }, function () {
            wait = async()
            processor.process({ json: { callback: true } })
        })
    })
}
