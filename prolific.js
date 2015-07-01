var Logger = require('./logger')
var Supersede = require('supersede')
var slice = [].slice

exports._timestamp = function () {
    return new Date().toISOString()
}

exports._write = function (line) {
    this.sink.write(this.serializer.stringify(line) + '\n')
}

exports.serializer = JSON
exports.sink = process.stdout

exports._supersede = new Supersede('info')

exports.setLevel = function () {
    var vargs = slice.call(arguments)
    var path = (vargs.length == 1 ? '' : '.' + vargs.shift()).split('.')
    this._supersede.set(path, vargs[0])
}

exports.clearLevel = function (context) {
    var path = (context == null ? '*' : '.' + context).split('.')
    this._supersede.remove(path)
}

exports.createLogger = function (context) {
   return new Logger(context, exports)
}
