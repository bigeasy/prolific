require('proof/redux')(3, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../label'), program
    async(function () {
        argv([], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific/label/label.processor',
            parameters: { labels: [] },
            argv: [],
            terminal: false
        }, 'no labels')
        argv([ 'key=1', '--' ], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific/label/label.processor',
            parameters: { labels: [{ name: 'key', value: '1' }] },
            argv: [],
            terminal: true
        }, 'no labels and terminal')
        argv([ 'key=1' ], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific/label/label.processor',
            parameters: { labels: [{ name: 'key', value: '1' }] },
            argv: [],
            terminal: false
        }, 'labels')
    })
}
