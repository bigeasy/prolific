require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Watcher = require('../watcher')

    var path = require('path')
    var fs = require('fs')
    var fse = require('fs-extra')

    var Signal = require('signal')

    var cadence = require('cadence')
    var coalesce = require('extant')
    var Destructible = require('destructible')
    var destructible = new Destructible('t/watcher.t')

    async(function () {
        destructible.completed.wait(async())
    }, function () {
        okay(true, 'done')
    })

    destructible.monitor('test', cadence(function (async, destructible) {
        var configuration = {
            template: path.join(__dirname, 'configuration.json'),
            copy: path.join(__dirname, 'configuration.copy.json')
        }

        try {
            fs.unlinkSync(configuration.copy)
        } catch (error) {
        }

        var responses = [{
            value: null,
            signal: new Signal
        }, {
            value: 'x',
            signal: new Signal
        }, {
            value: 'x',
            signal: new Signal
        }, {
            value: fs.readFileSync(configuration.template, 'utf8'),
            signal: new Signal
        }]

        var signals = responses.map(function (response) {
            return response.signal
        })

        var signal = responses[0].signal

        var watcher = new Watcher(configuration.copy, {
            reload: cadence(function (async) {
                var response = responses.shift()
                response.signal.unlatch()
                return response.value
            })
        })

        watcher.monitor(destructible.monitor('watcher'))

        async(function () {
            signals.shift().wait(async())
        }, function () {
            signals.shift().wait(async())
        }, function () {
            async(function () {
                setImmediate(async())
            }, function () {
                fse.copySync(configuration.template, configuration.copy)
            })
            signals.shift().wait(async())
        }, function () {
            signals.shift().wait(async())
        }, function () {
            setTimeout(async(), 250)
        }, function () {
            watcher.destroy()
            watcher.destroy()
        })
    }), null)
}
