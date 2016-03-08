var Logger = require('./logger')
var Supersede = require('supersede')
var slice = [].slice
var Wafer = require('wafer')
var tz = require('timezone')

var facilities = {
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

var levels = {
    trace: 0,
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
}

// TODO Maybe rename configure?
var syslog
exports.syslog = function (options) {
    options || (options = {})
    syslog = {
        host: options.host || 'localhost',
        application: options.application || process.title,
        pid: options.pid || process.pid,
        facility: facilities[options.facility || 'local0'],
        context: null
    }
    syslog.context = syslog.host + ' ' +
        syslog.application + ' ' +
        syslog.pid + ' - - '
}

exports.syslog()

exports._timestamp = function () {
    return new Date().toISOString()
}

exports._Date = Date
exports._write = function (level, line) {
    this.sink.write(format(level, line))
}
var format = exports.format = function (level, line) {
    var timestamp = tz(exports._Date.now(), '%FT%T.%3NZ')
    return '<' + (syslog.facility * 8 + levels[level]) + '>1 ' + timestamp + ' ' +
        syslog.context +
        exports.serializer.stringify(line) + '\n'
}

exports.serializer = Wafer
exports.sink = process.stdout

exports._supersede = new Supersede
exports._supersede.set([ '' ], 'info')

exports.setLevel = function (path, level) {
    if (level == null) {
        level = path
        path = ''
    } else {
        path = '.' + path
    }
    this._supersede.set(path.split('.'), level)
}

exports.clearLevel = function (context) {
    if (context == null) {
        this._supersede.remove([ '' ])
        this._supersede.set([ '' ], 'info')
    } else {
        this._supersede.remove(('.' + context).split('.'))
    }
}

exports.createLogger = function (context) {
   return new Logger(context, exports)
}

exports.context = {}
