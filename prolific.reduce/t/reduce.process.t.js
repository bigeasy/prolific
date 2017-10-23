require('proof')(1, prove)

function prove (okay, callback) {
    var Processor = require('../reduce.processor')
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
                        array: [ 'a', 'b' ]
                    }
                }, {
                    json: {
                        callback: true
                    }
                }], 'reduce')
                callback()
            }
        }
    }
    var processor = new Processor({
        pivot: '$.instance',
        end: '$.ended',
        calculate: [ '$.duration = $.end - $.start' ]
    }, sink, { delay: 250 })

    processor.open(function () {})

    // Not processed.
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

    processor.close(function () {})

    setTimeout(function () {
        processor.process({ json: { callback: true } })
    }, 350)
}
