var Logger = require('./logger')
var Supersede = require('supersede')
var slice = [].slice
var Wafer = require('wafer')

exports._timestamp = function () {
    return new Date().toISOString()
}

exports._write = function (line) {
    this.sink.write(this.serializer.stringify(line) + '\n')
}

exports.serializer = Wafer
exports.sink = process.stdout

exports._supersede = new Supersede('info')

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
    var path = (context == null ? '*' : '.' + context).split('.')
    this._supersede.remove(path)
}

exports.createLogger = function (context) {
   return new Logger(context, exports)
}
