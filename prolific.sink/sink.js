var Acceptor = require('prolific.acceptor')


module.exports = {
    // Replace with a dummy date for testing.
    Date: Date,
    // Test a log entry for acceptance.
    json: function (path, level, qualifier, label, properties) {
        var joined = [{
            when: this.Date.now(),
            pid: process.pid,
            level: level,
            qualifier: qualifier,
            label: label,
            qualified: qualifier + '#' + label
        }, this.properties, properties]
        if (this.acceptor.accept(joined)) {
            this.queue.push(joined)
        }
    },
    // We start with a noop acceptor, so we have a `null` queue to assert that
    // nothing is going to happen unless you reconfigure the acceptor.
    // configure the sink to actually do something.
    queue: null,
    // Additional properties added to every message.
    properties: {},
    // Default acceptor accepts nothing.
    acceptor: new Acceptor(false, [])
}
