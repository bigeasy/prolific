require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../sprintf.argv'), program
    async(function () {
        argv([ 'string: %s, integer: %d', '$.string', '$.integer * 2', '--' ], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.sprintf/sprintf.processor',
            parameters: {
                format: 'string: %s, integer: %d',
                extractors: [ '$.string', '$.integer * 2' ]
            },
            argv: [],
            terminal: true
        }, 'configuration terminal')
        argv([ 'string: %(json.string)s' ], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.sprintf/sprintf.processor',
            parameters: {
                format: 'string: %(json.string)s',
                extractors: []
            },
            argv: [],
            terminal: false
        }, 'configuration non-terminal no extractors')
    })
}
