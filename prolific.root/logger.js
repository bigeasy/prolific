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
// If we wanted some sort of filter, here it would be, but no, let's not.
//  if (options.filter != null) entry = (options.filter)(entry)
    if (!(levels[level] <= levels[this._controller._supersede.get(this._path)])) {
        return
    }
    var name = vargs.shift(), values = {}
    vargs.unshift(prolific.context)
    while (vargs.length) {
        var properties = vargs.shift()
        for (var key in properties) {
// TODO Should we unpack exceptions here?
            values[key] = properties[key]
        }
    }
// TODO Should we add sequence and pid in the monitor or here?
    this._controller._write(level, {
        context: this._context,
        name: name,
        level: level,
        when: this._controller._Date.now(),
// TODO Not crazy about this name.
        values: values
    })
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
