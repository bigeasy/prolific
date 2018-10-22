require('proof')(2, require('cadence')(prove))

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
                    // TODO No longer an array, but okay for our tests.
                    path: [ '', 'prolific', 'example' ],
                    formatted: [],
                    level: 0,
                    json: {
                        when: 0,
                        instance: 1,
                        start: 0,
                        end: 1,
                        ended: true,
                        level: 'panic',
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
                when: 0,
                path: [ '', 'prolific', 'example' ],
                formatted: [],
                level: 0,
                json: {
                    when: 0,
                    instance: 1,
                    start: 0,
                    level: 'panic',
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
    }, function () {
        async(function () {
            destructible.monitor('processor', Processor, {
                pivot: '$.instance',
                end: '$.ended',
                delay: 50,
                arrivals: {  arrayed: '$arrayed', mapped: '$mapped', named: '$.qualifier + "_x"' }
            }, sink, async())
        }, function (processor) {
            async(function () {
                sink.gathered = []
                processor.process({
                    when: 0,
                    path: [ '', 'prolific', 'example' ],
                    formatted: [],
                    level: 0,
                    json: {
                        when: 0,
                        instance: 1,
                        start: 1,
                        end: 1,
                        ended: true,
                        qualified: 'prolific.example#end',
                        qualifier: 'end',
                        array: [ 'b' ]
                    }
                })
                setTimeout(async(), 250)
            }, function () {
                processor.process({ json: {} })
                okay(sink.gathered.shift(), {
                    path: [ '', 'prolific', 'example' ],
                    formatted: [],
                    level: 0,
                    json: {
                        when: 0,
                        instance: 1,
                        start: 1,
                        end: 1,
                        ended: true,
                        qualified: 'prolific.example#end',
                        qualifier: 'end',
                        array: [ 'b' ],
                        $mapped: { 'prolific.example#end': 0 },
                        $arrayed: [{
                            qualified: 'prolific.example#end', when: 0, offset: 0
                        }],
                        end_x: 0
                    }
                }, 'logged')
            })
        })
    })
}
