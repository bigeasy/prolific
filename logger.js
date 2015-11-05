var prolific = require('./prolific')

function Logger (context, controller) {
    this._context = context
    this._path = ('.' + context).split('.')
    this._controller = controller
    this.log = function () {
    var vargs = []
        for (var i = 0, I = arguments.length; i < I; i++) {
            vargs[i] = arguments[i]
        }
        this._log(vargs.shift(), vargs)
    }.bind(this)
}

var levels = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 }

Logger.prototype._log = function (level, vargs) {
    if (!(levels[level] <= levels[this._controller._supersede.get(this._path)])) {
        return
    }
    var entry = {
        context: this._context,
        name: vargs.shift(),
        level: level,
        timestamp: this._controller._timestamp()
    }
    vargs.unshift(prolific.context)
    while (vargs.length) {
        var properties = vargs.shift()
        for (var key in properties) {
            entry[key] = properties[key]
        }
    }
    this._controller._write(level, entry)
}

Logger.prototype.error = function () {
    var vargs = []
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs[i] = arguments[i]
    }
    this._log('error', vargs)
}

Logger.prototype.warn = function () {
    var vargs = []
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs[i] = arguments[i]
    }
    this._log('warn', vargs)
}

Logger.prototype.info = function () {
    var vargs = []
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs[i] = arguments[i]
    }
    this._log('info', vargs)
}

Logger.prototype.debug = function () {
    var vargs = []
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs[i] = arguments[i]
    }
    this._log('debug', vargs)
}

Logger.prototype.trace = function () {
    var vargs = []
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs[i] = arguments[i]
    }
    this._log('trace', vargs)
}

Logger.prototype.rescue = function (name) {
    var vargs = [], logger = this
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs[i] = arguments[i]
    }
    return function (error) {
        if (error) {
            logger._log('error', vargs.concat({ message: error.message, stack: error.stack }))
        }
    }
}

module.exports = Logger
