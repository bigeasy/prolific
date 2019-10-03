const coalesce = require('extant')
const Evaluator = require('prolific.evaluator')
const Queue = require('prolific.queue')
const path = require('path')
const net = require('net')

const assert = require('assert')

const rethrow = require('./uncaught')

class Shuttle {
    constructor (options) {
        this._env = coalesce(options.env, process.env)
        this._pid = coalesce(options.pid, process.pid)
        this._process = coalesce(options.process, process)
        this._queue = null
        if (this._env.PROLIFIC_SUPERVISOR_PROCESS_ID != null) {
            this.monitored = true
            this._initialze(options)
        } else {
            this.monitored = false
        }
    }

    _initialze (options) {
        const supervisorId = +this._env.PROLIFIC_SUPERVISOR_PROCESS_ID
        const directory = this._env.PROLIFIC_TMPDIR

        const queue = this._queue = new Queue(Date, directory,
                                              this._pid, coalesce(options.interval, 1000))

        queue.on('triage', processor => {
            const triage = Evaluator.create(processor.source, processor.resolved).triage()
            sink.json = function (level, qualifier, label, body, system) {
                if (triage(level, qualifier, label, body, system)) {
                    queue.push({
                        when: body.when || this.Date.now(), level, qualifier, label, body, system
                    })
                }
            }
            queue.version(processor.version)
        })

        if (options.uncaughtException == null || options.uncaughtException) {
            this._process.on('uncaughtException', rethrow('uncaught'))
        }

        if (options.unhandledRejection == null || options.unhandledRejection) {
            this._process.on('unhandledRejection', rethrow('unhandled'))
        }

        if (options.exit == null || options.exit) {
            this._process.on('exit', this.exit.bind(this))
        }

        // All filtering will be performed by the monitor initially. Until
        // we get a configuration we send everything.
        const sink = require('prolific.logger').sink

        sink.json = function (level, qualifier, label, body, system) {
            queue.push({
                when: body.when || this.Date.now(), level, qualifier, label, body, system
            })
        }

        queue.connect(net, path.resolve(this._env.PROLIFIC_TMPDIR, 'socket'))
    }

    exit (code) {
        if (this.monitored && !this.exited) {
            this.exited = true
            this._queue.exit(code)
        }
    }
}

module.exports = Shuttle
