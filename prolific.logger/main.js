var Logger = require('./logger')
var Supersede = require('supersede')

exports._Date = Date
exports._write = function (write) {
    this.sink.write(JSON.stringify(write) + '\n')
}

exports.sink = { write: function () {} }

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
