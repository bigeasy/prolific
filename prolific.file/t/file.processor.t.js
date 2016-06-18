require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var path = require('path')
    var fs = require('fs')
    var file = path.join(__dirname, 'log')
    var Processor = require('../file.processor')
    new Processor({ params: { file: file } })
    var processor = new Processor({
        params: { file: file, rotate: 8, pid: '0' },
        Date: { now: function () { return 0 } }
    })
    var resolved = path.join(__dirname, 'log-1970-01-01-00-00-0')
    async([function () {
        async.forEach(function (file) {
            async([function () {
                fs.unlink(file, async())
            }, /^ENOENT$/, function () {
            }])
        })([ resolved ])
    }], function () {
        processor.open(async())
    }, function () {
        processor.process({ a: 1 })
        processor.process({ a: 1 })
        setTimeout(async(), 250)
    }, function () {
        processor.process({ a: 1 })
        processor.close(async())
    }, function () {
        assert(fs.readFileSync(file + '-1970-01-01-00-00-0', 'utf8'),
            '{"a":1}\n{"a":1}\n{"a":1}\n', 'file')
    })
}
