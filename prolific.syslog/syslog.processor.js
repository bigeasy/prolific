var url = require('url')
var coalesce = require('extant')

var FACILITY = {
    kern: 0,
    user: 1,
    mail: 2,
    daemon: 3,
    auth: 4,
    syslog: 5,
    lpr: 6,
    news: 7,
    uucp: 8,
    clock: 9,
    sec: 10,
    ftp: 11,
    ntp: 12,
    audit: 13,
    alert: 14,
    local0: 16,
    local1: 17,
    local2: 18,
    local3: 19,
    local4: 20,
    local5: 21,
    local6: 22,
    local7: 23
}

var LEVEL = {
    trace: 7,
    debug: 7,
    info: 6,
    notice: 5,
    warning: 4,
    warn: 4,
    error: 3,
    err: 3,
    crit: 2,
    alert: 1,
    panic: 0,
    emerg: 0
}

function Processor (parameters, next) {
    this._format = parameters.format || 'json'
    this._application = parameters.application || process.title
    this._hostname = parameters.hostname || 'localhost'
    this._facility = FACILITY[parameters.facility || 'local0']
    this._serializer = parameters.serializer ? require(parameters.serializer) : JSON
    this._Date = parameters.Date || Date
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    var json = entry.json, pid = json.pid, when = json.when
    delete json.when
    delete json.pid
    var line = [
        '<' + (this._facility * 8 + LEVEL[entry.json.level]) + '>1',
        new Date(when).toISOString(),
        this._hostname,
        this._application,
        coalesce(pid, '-'),
        '-',
        '-',
        this._serializer.stringify(json)
    ]
    json.when = when
    json.pid = pid
    entry.formatted.push(line.join(' ') + '\n')
    this._next.process(entry)
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
