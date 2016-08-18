require('proof/redux')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../tee.argv')
    async(function () {
        argv([ 'test', '--key', 'value' ], {}, async())
    }, function (result) {
        assert(result, {
          moduleName: 'prolific.tee/tee.processor',
          parameters:
           { configuration:
              { processors:
                 [ { moduleName: 'prolific.test/test.processor',
                     parameters: { params: { key: 'value' } },
                     argv: [],
                     terminal: false } ] } },
          argv: [],
          terminal: false
        }, 'configuration')
    })
}
