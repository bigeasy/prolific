var sink = require('prolific.resolver').sink

function Logger (qualifier) {
    this.qualifier = qualifier
    this._path = ('.' + qualifier).split('.')
    this.log = this._log.bind(this)
}

Logger.prototype.log = function (level, name, properties) {
    sink.json(this._path, level, this.qualifier, name, properties)
}

Logger.prototype.concat = function (level, name) {
    var object = {}
    for (var i = 2, I = arguments.length; i < I; i++) {
        var properties = arguments[i]
        for (var key in properties) {
            object[key] = properties[key]
        }
    }
    sink.json(this._path, level, this.qualifier, name, properties)
}

; [ 'error', 'warn', 'info', 'debug', 'trace' ].forEach(function (level) {
    Logger.prototype[level] = function (name, properties) {
        sink.json(this._path, level, this.qualifier, name, properties)
    }
})

Logger.createLogger = function (context) { return new Logger(context) }

Logger.sink = sink

module.exports = Logger
