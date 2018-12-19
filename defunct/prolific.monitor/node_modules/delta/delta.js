var rescuers = [], listeners = [], push = [].push
var events = require('events')

function Delta (callback) {
    if (!(this instanceof Delta)) {
        return new Delta(callback)
    }
    this._callback = callback
    this._results = []
    this._waiting = 0
    this._listeners = []
    this._completed = false
    this._canceled = 0
    this._instance = INSTANCE++
}

Delta.prototype.ee = function (ee) {
    return new Constructor(this, ee)
}

Delta.prototype._unlisten = function () {
    this._listeners.forEach(function (listener) {
        unlisten(listener, this)
    }, this)
    this._listeners.length = 0
}

Delta.prototype.off = function (ee, name, f) {
    var listeners = this._listeners, i = 0, I = listeners.length, listener
    while (i < I) {
        listener = listeners[i]
        if (
            ee === listener.ee &&
            (!name || name == listener.name) &&
            (!f || f === listener.f)
        ) {
            if (listener.action === get && !--this._waiting) {
                this._done()
                break
            }
            unlisten(listener, this)
            listeners.splice(i, 1)
            I--
        } else {
            i++
        }
    }
}

Delta.prototype.cancel = function (vargs) {
    if (!this._completed) {
        this._completed = true
        this._canceled++
        this._unlisten()
        this._callback.apply(null, vargs)
    }
}

function unlisten (listener, delta) {
    if (listener.ee != null || typeof listener.ee.removeListener == 'function') {
        listener.f = null
        listener.ee.removeListener(listener.name, listener.listener)
        listener.heap.push(listener)
    } else {
        console.log('no removeListener')
        var stackTraceLimit = Error.stackTraceLimit
        Error.stackTraceLimit = Infinity
        console.log(new Error().stack)
        Error.stackTraceLimit = stackTraceLimit
        console.log('delta replaced', delta === listener.delta)
        console.log(listener)
        console.log(listener.ee)
        console.log(typeof listener.ee)
        console.log(listener.ee instanceof events.EventEmitter)
        if (listener.ee != null && typeof listener.ee == 'object') {
            console.log(listener.ee.constructor.name)
            console.log(listener.ee)
        }
    }
}

Delta.prototype._rescue = function (error, ee) {
    error.ee = ee
    this._unlisten()
    this._callback.call(null, error)
}

Delta.prototype._done = function () {
    var vargs = []
    for (var i = 0, I = this._results.length; i < I; i++) {
        push.apply(vargs, this._results[i])
    }
    if (vargs.length) {
        vargs.unshift(null)
    }
    this._unlisten()
    this._callback.apply(null, vargs)
    this._completed = true
}

var INSTANCE = 0

function Constructor (delta, ee) {
    var rescuer = rescuers.pop()
    if (rescuer == null) {
        rescuer = {
            instance: delta._instance,
            delta: delta,
            ee: ee,
            name: 'error',
            listener: function (error) {
                rescuer.delta._rescue(error, rescuer.ee)
                rescuers.push(rescuer)
            },
            heap: rescuers
        }
    } else {
        rescuer.delta = delta
        rescuer.ee = ee
        rescuer.instance = delta._instance
    }

    delta._listeners.push(rescuer)

    ee.on('error', rescuer.listener)

    this._delta = delta
    this._ee = ee
}

function gather (vargs) {
    push.apply(this.delta._results[this.index][0], vargs)
}

function get (vargs) {
    push.apply(this.delta._results[this.index], vargs)
    this.delta.off(this.ee, this.name)
}

function invoke (vargs) {
    try {
        this.f.apply(null, vargs)
    } catch (error) {
        this.delta._rescue(error)
    }
}

Constructor.prototype.on = function (name, object) {
    var listener = listeners.pop()

    if (listener == null) {
        listener = {
            instance: this._delta._instance,
            delta: this._delta,
            ee: this._ee,
            name: name,
            action: null,
            listening: true,
            index: 0,
            f: null,
            listener: function () {
                var vargs = new Array
                for (var i = 0, I = arguments.length; i < I; i++) {
                    vargs[i] = arguments[i]
                }
                listener.action(vargs)
            },
            heap: listeners
        }
    }

    listener.delta = this._delta
    listener.ee = this._ee
    listener.name = name
    listener.instance = this._delta._instance

    if (Array.isArray(object)) {
        this._delta._results.push([[]])
        listener.index = this._delta._results.length - 1
        listener.action = gather
    } else if (typeof object == 'function') {
        listener.action = invoke
        listener.f = object
    } else {
        this._delta._results.push([])
        this._delta._waiting++
        listener.index = this._delta._results.length - 1
        listener.action = get
    }

    this._delta._listeners.push(listener)
    this._ee.on(name, listener.listener)

    return this
}

Constructor.prototype.ee = function (ee) {
    return new Constructor(this._delta, ee)
}

Constructor.prototype.cancel = function (vargs) {
    this._delta.cancel(vargs)
}

module.exports = Delta
