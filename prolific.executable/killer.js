const assert = require('assert')
const events = require('events')
const Isochronous = require('isochronous')
const isRunning = require('is-running')

class Killer extends events.EventEmitter {
    constructor (interval, printer = { say: () => {} }) {
        super()
        this._isochronous = new Isochronous(interval, true, async () => {
            let i = 0, I = this._pids.length
            while (i < I) {
                const pid = this._pids[i]
                printer.say('liveness', { pid })
                if (!isRunning(pid)) {
                    this.emit('killed', pid)
                    this._pids.splice(i, 1)
                    I--
                } else {
                    i++
                }
            }
            if (this._pids.length == 0) {
                this._clean()
            }
            await this._unlatched
        })
        this.destroyed = false
        this._pids = []
        this._exited = {}
        this._clean()
    }

    _clean () {
        this._unlatched = new Promise(resolve => this._latch = resolve)
    }

    run () {
        return this._isochronous.start()
    }

    exited (pid) {
        assert(this._pids.filter(p => p == pid).length == 0)
        delete this._exited[pid]
    }

    unwatch (pid) {
        const index = this._pids.indexOf(pid)
        if (~index) {
            this._pids.splice(index, 1)
        }
        delete this._exited[pid]
    }

    watch (pid) {
        assert(!this.destroyed)
        if (this._exited[pid] == null) {
            this._exited[pid] = pid
            this._pids.push(pid)
            this._latch.call()
        }
    }

    destroy () {
        if (!this.destroyed) {
            this.destroyed = true
            this._isochronous.stop()
            this._latch.call()
        }
    }
}

module.exports = Killer
