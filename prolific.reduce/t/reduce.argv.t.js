require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var argv = require('../reduce.argv')
    var program
    async(function () {
        argv([
            '--qualified', 'application#request',
            '--calculate', '$.duration = $.end - $.start',
            '--gather', '$.records.push($$.qualified)',
            '--pivot', '$.instance',
            '--end', '$.end',
            '--timeout', '10000'
        ], async())
    }, function (result) {
        assert(result, {
            moduleName: 'prolific.reduce/reduce.processor',
            parameters: {
                qualified: 'application#request',
                calculate: [ '$.duration = $.end - $.start' ],
                gather: [ '$.records.push($$.qualified)' ],
                pivot: '$.instance',
                end: '$.end',
                timeout: '10000'
            },
            argv: [],
            terminal: false
        }, 'configuration')
    })
}
