require('proof')(6, prove)

function prove (okay) {
    var descendent = require('descendent')
    var Shuttle = require('../shuttle')
    var shuttle = new Shuttle
    var events = require('events')

    var stream = require('stream')

    var descendent = require('foremost')('descendent')

    descendent.process = new events.EventEmitter
    descendent.process.env = {
        PROLIFIC_SUPERVISOR_PROCESS_ID: '1',
        DESCENDENT_PROCESS_PATH: '1'
    }
    descendent.process.pid = 2
    descendent.process.stderr = new stream.PassThrough

    var sent = [ 'start message', 'start message again' ]
    descendent.process.connected = true
    descendent.process.send = function (message) {
        okay(message, {
            module: 'descendent',
            method: 'route',
            name: 'prolific:shuttle',
            to: [ 1 ],
            path: [ 2 ],
            body: '2/0'
        }, sent.shift())
    }

    require('prolific.sink').properties.pid = 0
    require('prolific.sink').Date = { now: function () { return 0 } }

    shuttle.start({
        uncaughtException: function (error) {
            okay(error.message, 'error', 'uncaught')
        },
        exit: true,
        Date: { now: function () { return 0 } }
    })

    require('prolific.sink').json('error', 'example', 'message', { key: 'value' }, { pid: 0 })

    shuttle.start()

    okay(descendent.process.stderr.read().toString().split('\n'), [
        '% 2/0 71c17733 aaaaaaaa 1 %',
        '{"method":"announce","body":{"path":[1,2]}}',
        ''
    ], 'stderr start')

    var pipe = new stream.PassThrough
    descendent.emit('prolific:pipe', {}, pipe)
    descendent.emit('prolific:accept', {
        body: {
            triage: require('./modularized').triage.toString(),
            version: 1
        }
    })

    require('prolific.sink').json('error', 'example', 'droppable', { key: 'value' }, { pid: 0 })
    require('prolific.sink').json('error', 'example', 'acceptible', { key: 'value' }, { pid: 0 })

    try {
        descendent.process.emit('uncaughtException', new Error('error'))
    } catch (e) {
        console.log(e.stack)
        console.log('caught')
    }

    // Already closed.
    shuttle.close()

    okay(descendent.process.stderr.read().toString().split('\n'), [
        '% 2/0 914abd6e 71c17733 1 %',
        '{"method":"entries","series":1,"checksum":2976566980,"chunks":1}',
        '% 2/0 b16acec4 914abd6e 0 %',
        '[{"when":0,"level":"error","qualifier":"example","label":"message","body":{"key":"value"},"system":{"pid":0}}]',
        '% 2/0 0dd5db35 b16acec4 1 %',
        '{"method":"entries","series":2,"checksum":180504813,"chunks":1}',
        '% 2/0 0ac248ed 0dd5db35 0 %',
        '[[{"method":"version","version":1}],{"when":0,"level":"error","qualifier":"example","label":"acceptible","qualified":"example#acceptible","pid":0,"key":"value"}]',
        '% 2/0 b798da34 0ac248ed 1 %',
        '{"method":"exit"}',
        ''
    ], 'stderr after close')

    shuttle = new Shuttle

    shuttle.start({ Date: { now: function () { return 0 } } })

    okay(descendent.process.stderr.read().toString().split('\n'), [
        '% 2/0 71c17733 aaaaaaaa 1 %',
        '{"method":"announce","body":{"path":[1,2]}}',
        ''
    ], 'stderr start again')

    shuttle.close()

    shuttle = new Shuttle

    descendent.process.env = {}

    shuttle.start()
    shuttle.close()
}
