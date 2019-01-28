require('proof')(1, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/file.t')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var path = require('path')

    var File = require('..')

    var file = path.join(__dirname, 'log')

    var now = 0

    var fs = require('fs')

    try {
        fs.unlinkSync(path.join(__dirname, 'log-1-1970-01-01-00-00'))
    } catch (e) {
        if (e.code != 'ENOENT') {
            throw e
        }
    }

    try {
        fs.unlinkSync(path.join(__dirname, 'log-1-1970-01-01-00-01'))
    } catch (e) {
        if (e.code != 'ENOENT') {
            throw e
        }
    }

    cadence(function (async) {
        async(function () {
            destructible.durable('file', File, {
                file: file,
                rotate: 20,
                pid: '1',
                Date: {
                    now: function () {
                        var result = now
                        now += 1000 * 60
                        return result
                    }
                }
            }, async())
        }, function (processor) {
            processor.process(JSON.stringify({ json: { a: 1 } }) + '\n')
            processor.process(JSON.stringify({ json: { a: 2 } }) + '\n')
            setTimeout(async(), 50)
        }, function () {
            var lines = fs.readFileSync(path.join(__dirname, 'log-1-1970-01-01-00-00'), 'utf8')
            lines = lines.split('\n')
            lines.pop()
            okay(lines.map(JSON.parse), [{
                json: { a: 1 }
            }, {
                json: { a: 2 }
            }], 'map')
        })
    })(destructible.durable('test'))
}
