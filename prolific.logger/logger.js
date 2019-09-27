module.exports = function (sink) {
    class Logger {
        constructor (qualifier) {
            this.qualifier = qualifier
        }

        log (level, label, properties) {
            sink.json(level, this.qualifier, label, properties, sink.properties)
        }

        concat (level, label, ...vargs) {
            const properties = Object.assign.apply(Object, vargs)
            sink.json(level, this.qualifier, label, properties, sink.properties)
        }

        stackTrace (...vargs) {
            return function (error) {
                const properties = Array.isArray(vargs[vargs.length - 1]) ? vargs.pop() : [ 'stack', 'code' ]
                const context = typeof vargs[vargs.length - 1] == 'object' ? vargs.pop() : {}
                const label = vargs.pop()
                const level = vargs.pop() || 'error'
                const merged = {}
                properties.forEach(function (name) {
                    if (name in error) {
                        merged[name] = error[name]
                    }
                })
                this.log(level, label, Object.assign(merged, context))
            }.bind(this)
        }
    }

    Object.keys(require('prolific.level')).forEach(function (level) {
        Logger.prototype[level] = function (label, properties) {
            sink.json(level, this.qualifier, label, properties, sink.properties)
        }
    })

    Logger.create = function (context) { return new Logger(context) }

    Logger.sink = sink

    return Logger
}
