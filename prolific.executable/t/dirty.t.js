require('proof')(3, require('cadence')(prove))

function prove (async, okay) {
    var dirty = require('../dirty')

    var path = require('path')
    var fs = require('fs')
    var fse = require('fs-extra')

    var Signal = require('signal')

    var configuration = path.join(__dirname, 'configuration.json')

    var body = fs.readFileSync(configuration, 'utf8')


    async(function () {
        dirty(configuration, body, async())
    }, function (isDirty) {
        okay(!isDirty, 'not dirty')
        dirty(path.join(__dirname, 'missing.json'), body, async())
    }, function (isDirty) {
        okay(isDirty, 'ENOENT')
        dirty(configuration, 'x', async())
    }, function (isDirty) {
        okay(isDirty, 'actually dirty')
    })
}
