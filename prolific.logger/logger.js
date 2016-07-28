var prolific = require('prolific')

function Logger (qualifier) {
    this.qualifier = qualifier
    this._path = ('.' + qualifier).split('.')
    this.log = this._log.bind(this)
}

Logger.prototype._log = function (level, name, properties) {
    prolific.json(this._path, level, this.qualifier, name, properties)
}

; [ 'error', 'warn', 'info', 'debug', 'trace' ].forEach(function (level) {
    Logger.prototype[level] = function (name, properties) {
        prolific.json(this._path, level, this.qualifier, name, properties)
    }
})

Logger.createLogger = function (context) { return new Logger(context) }

module.exports = Logger
