require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Processor = require('../filter.processor')
    var sink = {
        gathered: [],
        process: function (entry) {
            this.gathered.push(entry)
        }
    }
    var processor = new Processor({
        params: {
            select: '$.name == "foo" && $qualifier[2] == "bigeasy.prolific" && $level == TRACE'
        }
    }, sink)
    async(function () {
        processor.open(async())
    }, function () {
        processor.process({
            json: { name: "foo" },
            level: 0,
            qualifier: [
                null,
                "bigeasy",
                "bigeasy.prolific",
                "bigeasy.prolific.filter"
            ]
        })
        processor.process({
            json: { name: "bar" },
            level: 0,
            qualifier: [
                null,
                "bigeasy",
                "bigeasy.prolific",
                "bigeasy.prolific.filter"
            ]
        })
        assert(sink.gathered, [{
            json: { name: "foo" },
            level: 0,
            qualifier: [
                null,
                "bigeasy",
                "bigeasy.prolific",
                "bigeasy.prolific.filter"
            ]
        }], 'gathered')
    }, function () {
        processor.close(async())
    })
}
