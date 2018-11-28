/*
    ___ usage ___ en_US ___
    usage: node closer.bin.js <options>

    options:

        -i, --inherit   <number>        file handles to inherit

    ___ $ ___ en_US ___
    ___ . ___
*/
require('arguable')(module, function (program, callback) {
    var children = require('child_process')

    var delta = require('delta')

    var Chunk = require('prolific.chunk')

    var Destructible = require('destructible')
    var destructible = new Destructible('prolific/closer.bin')

    program.on('shutdown', destructible.destroy.bind(destructible))

    destructible.completed.wait(callback)

    var cadence = require('cadence')

    var descendent = require('foremost')('descendent')

    var inherit = require('prolific.inherit')

    var stdio = inherit(program)
    stdio.push('ipc')

    descendent.increment()

    var chunkNumber = 0
    var chunk = new Chunk('closer', chunkNumber, Buffer.from(''), chunkNumber + 1)
    program.stderr.write(Buffer.concat([ chunk.header('aaaaaaaa'), chunk.buffer ]))
    var previousChecksum = chunk.checksum

    descendent.on('descendent:close', function (message) {
        var buffer = Buffer.from(JSON.stringify({ path: message.from }) + '\n')
        var chunk = new Chunk('closer', ++chunkNumber, buffer, buffer.length)
        program.stderr.write(Buffer.concat([ chunk.header(previousChecksum), chunk.buffer ]))
        previousChecksum = chunk.checksum
    })

    cadence(function (async) {
        var child = children.spawn(program.argv[0], program.argv.slice(1), { stdio: stdio })
        descendent.addChild(child, null)
        async(function () {
            delta(async()).ee(child).on('close')
        }, function () {
            descendent.decrement()
        })
    })(destructible.durable('main'))
})
