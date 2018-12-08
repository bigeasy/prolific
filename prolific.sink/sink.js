module.exports = {
    // Replace with a dummy date for testing.
    Date: Date,
    // Test a log entry for acceptance.
    json: function () {},
    // Additional properties added to every message.
    properties: { pid: process.pid }
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
