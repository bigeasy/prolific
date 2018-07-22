var cadence = require('cadence')
var fs = require('fs')
var deepEqual = require('deep-equal')

module.exports = cadence(function (async, filename, previous) {
    async([function () {
        fs.readFile(filename, 'utf8', async())
    }, function (error) {
        console.log(error.stack)
        return [ async.break, true ]
    }], function (current) {
        var json
        try {
            json = JSON.parse(current)
        } catch (error) {
            return true
        }
        return ! deepEqual(json, previous, { strict: true })
    })
})
