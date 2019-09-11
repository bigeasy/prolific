const events = require('events')
const Isochronous = require('isochronous')
const isRunning = require('is-running')

class Killer extends events.EventEmitter {
    constructor (interval) {
        super()
        this._isochronous = new Isochronous(interval, true, async () => {
            let i = 0, I = this._pids.length
            while (i < I) {
                const pid = this._pids[i]
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
        this._pids = []
        this._clean()
    }

    _clean () {
        this._unlatched = new Promise(resolve => this._latch = resolve)
    }

    run () {
        return this._isochronous.start()
    }

    watch (pid) {
        this._pids.push(pid)
        this._latch.call()
    }

    destroy () {
        this._isochronous.stop()
        this._latch.call()
    }
}

module.exports = Killer
