var slice = [].slice

function Logger (context, controller) {
    this._context = context
    this._path = ('.' + context).split('.')
    this._controller = controller
    this.log = function () {
        var vargs = slice.call(arguments)
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
    while (vargs.length) {
        var properties = vargs.shift()
        for (var key in properties) {
            entry[key] = properties[key]
        }
    }
    this._controller._write(entry)
}

Logger.prototype.error = function () {
    this._log('error', slice.call(arguments))
}

Logger.prototype.warn = function () {
    this._log('warn', slice.call(arguments))
}

Logger.prototype.info = function () {
    this._log('info', slice.call(arguments))
}

Logger.prototype.debug = function () {
    this._log('debug', slice.call(arguments))
}

Logger.prototype.trace = function () {
    this._log('trace', slice.call(arguments))
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
