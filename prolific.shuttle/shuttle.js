var coalesce = require('extant')

var abend = require('abend')

var descendent = require('foremost')('descendent')

var Evaluator = require('prolific.evaluator')
var Queue = require('prolific.queue')

var LEVEL = require('prolific.level')

var createUncaughtExceptionHandler = require('./uncaught')

var assert = require('assert')

function Shuttle () {
    this._state = 'created'
    this._queue = null
}

Shuttle.prototype.start = function (options, callback) {
    if (this._state !== 'created') {
        return
    }
    options || (options = {})
    if (descendent.process.env.PROLIFIC_SUPERVISOR_PROCESS_ID != null) {
        this._state = 'started'
        this._listen(descendent, options, coalesce(callback, abend))
    } else {
        this._state = 'closed'
    }
}

Shuttle.prototype._listen = function (descendent, options) {
    var now = coalesce(options.Date, Date).now()
    var monitorProcessId = +descendent.process.env.PROLIFIC_SUPERVISOR_PROCESS_ID

    descendent.increment()

    var id = [ descendent.process.pid, now ]
    var path = descendent.path.splice(descendent.path.indexOf(monitorProcessId))

    var queue = new Queue(512, id, descendent.process.stderr, { path: path })
    this._queue = queue

    if (options.uncaughtException != null) {
        var uncaughtException = this.uncaughtException(options.uncaughtException)
        descendent.process.on('uncaughtException', function (error) {
            uncaughtException(error)
            queue.exit()
        })
    }

    if (options.exit != null) {
        descendent.process.on('exit', queue.exit.bind(queue))
    }

    // All filtering will be performed by the monitor initially. Until
    // we get a configuration we send everything.
    var sink = require('prolific.resolver').sink
    sink.json = function (level, qualifier, label, body, system) {
        queue.push({
            when: this.Date.now(),
            level: level,
            qualifier: qualifier,
            label: label,
            body: body,
            system: system
        })
    }

    this._handlers = { pipe: null, accept: null }

    descendent.once('prolific:pipe', this._handlers.pipe = function (message, handle) {
        queue.setPipe(handle)
    })
    descendent.on('prolific:accept', this._handlers.accept = function (message) {
        assert(message.body.triage)
        var triage = Evaluator.create(message.body.triage, require('prolific.require').require)
        assert(triage)
        sink.json = function (level, qualifier, label, body, system) {
            if (triage(LEVEL[level], qualifier, label, body, system)) {
                var header = {
                    when: body.when || this.Date.now(),
                    level: level,
                    qualifier: qualifier,
                    label: label,
                    qualified: qualifier + '#' + label
                }
                for (var key in system) {
                    header[key] = system[key]
                }
                for (var key in body) {
                    header[key] = body[key]
                }
                queue.push(header)
            }
        }
        queue.push([{ method: 'version', version: message.body.version }])
    })

    descendent.up(monitorProcessId, 'prolific:shuttle', id.join('/'))
}

function uncaughtException (shuttle, logger) {
    var handler = createUncaughtExceptionHandler(logger)
    return function (error) {
        shuttle.close()
        handler(error)
        throw error
    }
}

Shuttle.prototype.uncaughtException = function (logger) {
    return uncaughtException(this, logger)
}


Shuttle.prototype.close = function () {
    if (this._state === 'started') {
        this._state = 'closed'
        descendent.removeListener('prolific:pipe', this._handlers.pipe)
        descendent.removeListener('prolific:accept', this._handlers.accept)
        descendent.decrement()
        this._queue.close()
    }
}

Shuttle.sink = require('prolific.sink')

module.exports = Shuttle
