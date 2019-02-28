require('proof')(4, require('cadence')(prove))

function prove (async, okay) {
    var dirty = require('../dirty')

    var path = require('path')
    var fs = require('fs')
    var fse = require('fs-extra')

    var Signal = require('signal')

    var configuration = path.join(__dirname, 'configuration.json')

    var body = JSON.parse(fs.readFileSync(configuration, 'utf8'))

    async(function () {
        dirty(configuration, body, async())
    }, function (isDirty) {
        okay(!isDirty, 'not dirty')
        dirty(path.join(__dirname, 'missing.json'), body, async())
    }, function (isDirty) {
        okay(isDirty, 'ENOENT')
        dirty(__filename, {}, async())
    }, function (isDirty) {
        okay(isDirty, 'bad JSON')
        dirty(configuration, {}, async())
    }, function (isDirty) {
        okay(isDirty, 'actually dirty')
    })
}
