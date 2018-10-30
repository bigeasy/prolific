module.exports = {
    // Replace with a dummy date for testing.
    Date: Date,
    // Test a log entry for acceptance.
    json: function () {},
    // We start with a noop acceptor, so we have a `null` queue to assert that
    // nothing is going to happen unless you reconfigure the acceptor.
    // configure the sink to actually do something.
    queue: null,
    // Additional properties added to every message.
    properties: {}
}

/*

sink.json = function (level, qualifier, label, body) {
    var header = {
        when: this.Date.now(),
        pid: process.pid,
        level: level,
        qualifier: qualifier,
        label: label,
        qualified: qualifier + '#' + label
    }
    if (triage(LEVEL[level], header, body, this.properties)) {
        for (var key in system) {
            header[key] = system[key]
        }
        for (var key in body) {
            header[key] = body[key]
        }
        this.queue.push(entry)
    }
}

sink.json = function (level, qualifier, label, body) {
    this.queue.push({
        level: level,
        qualifier: qualifier,
        label: label,
        body: body,
        system: this.properties
    })
}

sink.setTriage(function (level, header, body, system, append) {
    append.header = header
    append.body = body
    append.system = system
    return true
})

*/
