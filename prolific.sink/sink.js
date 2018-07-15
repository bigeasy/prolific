var Acceptor = require('prolific.accept')


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
    // TODO Needs to be a noop to start.
    queue: [],
    // Additional properties added to every message.
    properties: {},
    // Default acceptor accepts nothing.
    acceptor: new Acceptor(true, [])
}
