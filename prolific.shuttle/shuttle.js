const coalesce = require('extant')
const descendent = require('foremost')('descendent')

const Evaluator = require('prolific.evaluator')
const Queue = require('prolific.queue')

const LEVEL = require('prolific.level')

const assert = require('assert')

const rethrow = require('./uncaught')

class Shuttle {
    constructor (options) {
        this._queue = null
        if (descendent.process.env.PROLIFIC_SUPERVISOR_PROCESS_ID != null) {
            this.monitored = true
            this._initialze(options)
        } else {
            this.monitored = false
        }
    }

    _initialze (options) {
        descendent.increment()

        // **TODO** A hack to prevent Prolific Shuttle from preventing the event
        // loop from exiting, but far too invasive. We must remove.
        descendent.process.channel.unref()

        const supervisorId = +descendent.process.env.PROLIFIC_SUPERVISOR_PROCESS_ID
        const path = descendent.path.splice(descendent.path.indexOf(supervisorId))
        const directory = descendent.process.env.PROLIFIC_TMPDIR

        const queue = this._queue = new Queue(Date, directory,
                                              path, coalesce(options.interval, 1000))

        queue.on('triage', update => {
            const processor = Evaluator.create(update.source, update.file)
            assert(processor.triage)
            const triage = processor.triage(require('prolific.require').require)
            sink.json = function (level, qualifier, label, body, system) {
                if (triage(LEVEL[level], qualifier, label, body, system)) {
                    queue.push({
                        when: body.when || this.Date.now(), level, qualifier, label, body, system
                    })
                }
            }
            queue.version(update.version)
        })

        if (options.uncaughtException == null || options.uncaughtException) {
            descendent.process.on('uncaughtException', rethrow('uncaught'))
        }

        if (options.unhandledRejection == null || options.unhandledRejection) {
            descendent.process.on('unhandledRejection', rethrow('unhandled'))
        }

        if (options.exit == null || options.exit) {
            descendent.process.on('exit', this.exit.bind(this))
        }

        // All filtering will be performed by the monitor initially. Until
        // we get a configuration we send everything.
        const sink = require('prolific.resolver').sink

        sink.json = function (level, qualifier, label, body, system) {
            queue.push({
                when: body.when || this.Date.now(), level, qualifier, label, body, system
            })
        }

        const handlers = this._handlers = {
            'prolific:pipe': function (message, handle) {
                delete handlers['prolific:pipe']
                handle.unref()
                queue.setSocket(handle)
            }
        }

        descendent.once('prolific:pipe', this._handlers['prolific:pipe'])
    }

    exit (code) {
        if (this.monitored && !this.exited) {
            this.exited = true
            for (const name in this._handlers) {
                descendent.removeListener(name, this._handlers[name])
            }
            descendent.decrement()
            this._queue.exit(code)
        }
    }
}

Shuttle.sink = require('prolific.resolver').sink

module.exports = Shuttle
