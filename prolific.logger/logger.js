var sink = require('prolific.resolver').sink

function Logger (qualifier) {
    this.qualifier = qualifier
}

Logger.prototype.log = function (level, label, properties) {
    sink.json(level, this.qualifier, label, properties)
}

Logger.prototype.concat = function (level, label) {
    var object = {}
    for (var i = 2, I = arguments.length; i < I; i++) {
        var properties = arguments[i]
        for (var key in properties) {
            object[key] = properties[key]
        }
    }
    sink.json(level, this.qualifier, label, properties)
}

Object.keys(require('prolific.level')).forEach(function (level) {
    Logger.prototype[level] = function (label, properties) {
        sink.json(level, this.qualifier, label, properties)
    }
})

Logger.createLogger = function (context) { return new Logger(context) }

Logger.sink = sink

module.exports = Logger
