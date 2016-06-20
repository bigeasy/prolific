var tz = require('timezone')
var url = require('url')

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
    trace: 0,
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
// TODO: Fatal.
}

function Processor (parameters, next) {
    var query = parameters.params
    this._format = query.format || 'json'
    var application = query.application || process.title
    var host = query.host || 'localhost'
    var pid = query.pid == null ? 'pid' : query.pid
    this._facility = FACILITY[query.facility || 'local0']
    this._context = host + ' ' + application + ' ' + pid + ' - - '
    this._serializer = query.serializer ? require(query.serializer) : JSON
    this._Date = parameters.Date || Date
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    var amalgamated = {
        sequence: entry.sequence,
        level: entry.level,
        context: entry.context,
        name: entry.name
    }
    for (var key in entry.common) {
        amalgamated[key] = entry.common[key]
    }
    for (var key in entry.specific) {
        amalgamated[key] = entry.specific[key]
    }
    entry.formatted = '<' + (this._facility * 8 + LEVEL[entry.level]) + '>1 ' +
// TODO NO! What? Where is the real timestamp?
        tz(this._Date.now(), '%FT%T.%3NZ') + ' ' +
        this._context +
        this._serializer.stringify(amalgamated) + '\n'
    this._next.process(entry)
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
