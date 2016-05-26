var prolific = require('prolific')

function Logger (context) {
    this.context = context
    this._path = ('.' + context).split('.')
}

; [ 'error', 'warn', 'info', 'debug', 'trace' ].forEach(function (level) {
    Logger.prototype[level] = function (name, properties) {
        prolific.json(this._path, level, this.context, name, properties)
    }
})

Logger.createLogger = function (context) { return new Logger(context) }

module.exports = Logger
