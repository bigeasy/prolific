require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../tee.argv')
    async(function () {
        argv([ 'test', '--key', 'value', 'node' ], {}, async())
    }, function (result) {
        assert(result, {
          moduleName: 'prolific.tee/tee.processor',
          parameters:
           { configuration:
              { processors:
                 [ { moduleName: 'prolific.test/test.processor',
                     parameters: { params: { key: 'value' } },
                     argv: [ 'node' ],
                     terminal: false } ] } },
          argv: [ 'node' ],
          terminal: false
        }, 'configuration')
    })
}
