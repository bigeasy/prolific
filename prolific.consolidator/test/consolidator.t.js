require('proof')(3, prove)

function prove (okay, callback) {
    var Destructible = require('destructible')

    var destructible = new Destructible('test/consolidator')

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var stream = require('stream')

    var Consolidator = require('../consolidator')

    var synchronous = new stream.PassThrough
    var asynchronous = new stream.PassThrough

    var queue = []
    var consolidator = new Consolidator(asynchronous, synchronous, queue)

    consolidator.asynchronous(destructible.ephemeral('asynchronous'))
    consolidator.synchronous(destructible.ephemeral('synchronous'))

    cadence(function (async) {
        async(function () {
            asynchronous.write(JSON.stringify([{ value: 1 }]) + '\n', async())
        }, function () {
            okay(queue.shift(), [{ value: 1 }], 'async')
            synchronous.write(JSON.stringify({
                method: 'entries',
                series: 1,
                entries: [{ value: 2 }]
            }) + '\n', async())
        }, function () {
            okay(queue.length, 0, 'earlier in series')
            synchronous.write(JSON.stringify({
                method: 'entries',
                series: 2,
                entries: [{ value: 2 }]
            }) + '\n', async())
        }, function () {
            okay(queue.shift(), [{ value: 2 }], 'sync')
            consolidator.exit()
        })
    })(destructible.durable('test'))
}
