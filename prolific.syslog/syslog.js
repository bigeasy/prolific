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

function Logger (configuration) {
    var parsed = url.parse(configuration.url, true)
    this._format = parsed.query.format || 'json'
    var application = parsed.query.application || process.title
    var host = parsed.query.host || 'localhost'
    var pid = parsed.query.pid || 'pid'
    this._facility = FACILITY[parsed.query.facility || 'local0']
    this._context = host + ' ' + application + ' ' + pid + ' - - '
    this._serializer = require([ 'prolific.serializer', parsed.query.serializer || 'json'].join('.'))
    this._Date = configuration.Date || Date
}

Logger.prototype.start = function (callback) { callback() }

Logger.prototype.filter = function (entry) {
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
        tz(this._Date.now(), '%FT%T.%3NZ') + ' ' +
        this._context +
        this._serializer.stringify(amalgamated) + '\n'
    return [ entry ]
}

Logger.prototype.stop = function (callback) { callback() }

module.exports = Logger
