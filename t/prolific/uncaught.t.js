require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var stream = require('stream')
    var prolific = require('../..')
    var logger = prolific.createLogger('prolific.uncaught')
    var uncaught = require('../../uncaught')
    var Queue = require('../../queue')
    var err = new stream.PassThrough
    var queue = new Queue()
    prolific.sink = queue
    uncaught(logger, queue, err)(new Error('uncaught'))
    assert(/^<(\d+)>/.exec(err.read().toString())[1], '132', 'error')
}
