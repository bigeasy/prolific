var sink = require('prolific.resolver').sink

function Logger (qualifier) {
    this.qualifier = qualifier
}

Logger.prototype.log = function (level, label, properties) {
    sink.json(level, this.qualifier, label, properties, sink.properties)
}

Logger.prototype.concat = function (level, label) {
    var object = {}
    for (var i = 2, I = arguments.length; i < I; i++) {
        var properties = arguments[i]
        for (var key in properties) {
            object[key] = properties[key]
        }
    }
    sink.json(level, this.qualifier, label, properties, sink.properties)
}

Logger.prototype.stackTrace = function () {
    var vargs = []
    vargs.push.apply(vargs, arguments)
    return function (error) {
        var properties = Array.isArray(vargs[vargs.length - 1]) ? vargs.pop() : [ 'stack', 'code' ]
        var context = typeof vargs[vargs.length - 1] == 'object' ? vargs.pop() : {}
        var label = vargs.pop()
        var level = vargs.pop() || 'error'
        var merged = {}
        properties.forEach(function (name) {
            if (name in error) {
                merged[name] = error[name]
            }
        })
        for (var name in context) {
            merged[name] = context[name]
        }
        this.log(level, label, merged)
    }.bind(this)
}

Object.keys(require('prolific.level')).forEach(function (level) {
    Logger.prototype[level] = function (label, properties) {
        sink.json(level, this.qualifier, label, properties, sink.properties)
    }
})

Logger.createLogger = function (context) { return new Logger(context) }

Logger.sink = sink

module.exports = Logger
