require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../filter.processor')
    var processor = new Processor({
        params: {
            select: '$.name == "foo" && $context[2] == "bigeasy.prolific" && $level == TRACE'
        }
    })
    async(function () {
        processor.open(async())
    }, function () {
        assert(processor.process({
            level: "trace",
            context: "bigeasy.prolific.filter",
            name: "foo"
        }), [{
            level: "trace",
            context: "bigeasy.prolific.filter",
            name: "foo"
        }], 'passed')
        assert(processor.process({
            level: "trace",
            context: "bigeasy.paxos.filter",
            name: "foo"
        }), [], 'failed')
    }, function () {
        processor.close(async())
    })
}
